using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.Realtime;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games;

public sealed class ManualGameClock : TimeProvider
{
    private DateTimeOffset now = DateTimeOffset.UtcNow;
    public override DateTimeOffset GetUtcNow() => now;
    public void Advance(TimeSpan by) => now += by;
}

public sealed class LiveGameFactory : RealtimeQuizLiveFactory
{
    public ManualGameClock Clock { get; } = new();
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Clock);
            // Tests drive the exact same worker tick explicitly, with no real-time sleeps.
            foreach (var descriptor in services.Where(s => s.ImplementationType == typeof(LiveGameWorker)).ToList())
                services.Remove(descriptor);
        });
    }
}

public class LiveGameTests(LiveGameFactory factory) : IClassFixture<LiveGameFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private record Setup(HttpClient Host, string HostId, GameDto Game, JoinGameResponse Player, QuestionDto Question);

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task AnswerIsPersistedOnceAndReconnectRestoresResults(QuizKind kind)
    {
        var setup = await CreateAsync(kind);
        await Start(setup);
        var request = Answer(setup, kind);
        await Submit(setup, request);
        await Submit(setup, request);
        await using var player = factory.CreateHubConnection();
        await player.StartAsync(Ct);
        var state = await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.Player.Token, Ct);
        Assert.True(state.HasAnswered);
        Assert.Equal(request, state.CurrentAnswer);
        Assert.Null(state.Results);
        Assert.Null(state.Leaderboard);
        Assert.DoesNotContain("isCorrect", System.Text.Json.JsonSerializer.Serialize(state, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)));
        await Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId));

        await using var reconnect = factory.CreateHubConnection();
        await reconnect.StartAsync(Ct);
        var restored = await reconnect.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.Player.Token, Ct);
        Assert.NotNull(restored.Results);
        Assert.Equal(kind == QuizKind.QuizChoice ? 150 : 0, restored.Results.Points);
        Assert.Equal(restored.Results.Points, restored.Results.Total);
        Assert.Equal(1, restored.Results.Place);
        Assert.NotNull(restored.Leaderboard);

        await using var host = factory.CreateHubConnection(setup.Host.BearerToken());
        await host.StartAsync(Ct);
        var hostState = await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);
        Assert.Equal(1, hostState.Results!.Answered);
        if (kind == QuizKind.OpenText) Assert.Equal("Kyiv", Assert.Single(hostState.Results.OpenAnswers!).Text);
        else Assert.Equal(1, hostState.Results.Options!.Sum(o => o.Count));
    }

    [Fact]
    public async Task InvalidAnswersAndClosedQuestionsAreRejected()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Assert.ThrowsAsync<ConflictException>(() => Submit(setup, new(1, setup.Question.Options![0].Id)));
        await Start(setup);
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, int.MaxValue)));
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, Text: "4")));
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, setup.Question.Options![0].Id, "4")));
        await Assert.ThrowsAsync<ConflictException>(() => Submit(setup, new(2, setup.Question.Options![0].Id)));
        factory.Clock.Advance(TimeSpan.FromSeconds(30));
        await Assert.ThrowsAsync<ConflictException>(() => Submit(setup, new(1, setup.Question.Options![0].Id)));
        await Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId));
        await Assert.ThrowsAsync<ConflictException>(() => Submit(setup, new(1, setup.Question.Options![0].Id)));
        await Flow(f => f.EndAsync(setup.Game.Id, setup.HostId));
        await Assert.ThrowsAsync<NotFoundException>(() => Submit(setup, new(1, setup.Question.Options![0].Id)));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task EmptyOpenTextIsRejected(string? text)
    {
        var setup = await CreateAsync(QuizKind.OpenText);
        await Start(setup);
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, Text: text)));
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, Text: new string('x', 201))));
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, OptionId: 1, Text: "Kyiv")));
    }

    [Fact]
    public async Task ForeignQuestionOptionAndForeignPlayerAreRejected()
    {
        var setup = await CreateAsync(QuizKind.PollChoice);
        var other = await CreateAsync(QuizKind.PollChoice);
        await Start(setup);
        await Assert.ThrowsAsync<DomainValidationException>(() => Submit(setup, new(1, other.Question.Options![0].Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => InScope(s => s.GetRequiredService<LiveGameService>()
            .SubmitAsync(setup.Game.Id, other.Player.PlayerId, Answer(setup, QuizKind.PollChoice))));
    }

    [Fact]
    public async Task TwoConcurrentAnswersPersistAndScoreExactlyOne()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Start(setup);
        var errors = await Race(() => Submit(setup, Answer(setup, QuizKind.QuizChoice)), () => Submit(setup, Answer(setup, QuizKind.QuizChoice)));
        Assert.All(errors, error => Assert.Null(error));
        await InScope(async s =>
        {
            var db = s.GetRequiredService<AppDbContext>();
            var answer = await db.QuizAnswers.SingleAsync(a => a.PlayerId == setup.Player.PlayerId, Ct);
            var player = await db.Players.SingleAsync(p => p.Id == setup.Player.PlayerId, Ct);
            Assert.Equal(150, player.TotalScore);
            Assert.Equal(player.TotalScore, answer.Points);
            Assert.Equal(factory.Clock.GetUtcNow().UtcDateTime, answer.AnsweredAtUtc);
            Assert.Equal(0, answer.ElapsedMs);
        });
    }

    [Fact]
    public async Task CloseRacingWithAnswerNeverProducesPartialResults()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Start(setup);
        var errors = await Race(() => Submit(setup, Answer(setup, QuizKind.QuizChoice)),
            () => Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId)));
        Assert.All(errors, error => Assert.True(error is null or ConflictException));
        await InScope(async s =>
        {
            var live = s.GetRequiredService<LiveGameService>();
            var result = await live.HostResultsAsync(setup.Game.Id, 1);
            var leaderboard = await live.LeaderboardAsync(setup.Game.Id);
            Assert.Equal(errors[0] is null ? 1 : 0, result.Answered);
            Assert.Equal(result.Answered * 150, Assert.Single(leaderboard.Entries).Total);
        });
    }

    [Fact]
    public async Task AnOverdueQuestion_IsClosedOnTheWorkerTick()
    {
        var setup = await CreateAsync(QuizKind.PollChoice);
        await Start(setup);
        factory.Clock.Advance(TimeSpan.FromSeconds(30));
        await Tick();
        Assert.Equal(GameStatus.Results, await Status(setup));
        await Tick();
        Assert.Equal(GameStatus.Results, await Status(setup));
    }

    [Fact]
    public async Task TimerAndHostCloseOnceAndExtensionsInvalidateOldDeadlines()
    {
        var setup = await CreateAsync(QuizKind.PollChoice);
        var views = await Start(setup);
        Assert.Equal(factory.Clock.GetUtcNow().UtcDateTime, views.ForPlayers.Timing.ServerNowUtc);
        var oldDeadline = views.ForPlayers.Timing.EndsAtUtc!.Value;
        await Flow(f => f.AddTimeAsync(setup.Game.Id, setup.HostId, 10));
        factory.Clock.Advance(TimeSpan.FromSeconds(30));
        Assert.False(await InScope(s => s.GetRequiredService<GameFlowService>().CloseExpiredAsync(setup.Game.Id, 1, oldDeadline)));
        await Tick();
        Assert.Equal(GameStatus.Question, await Status(setup));
        factory.Clock.Advance(TimeSpan.FromSeconds(10));
        await using var player = factory.CreateHubConnection();
        var closed = player.Subscribe<int>("QuestionClosed");
        await player.StartAsync(Ct);
        await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.Player.Token, Ct);
        var errors = await Race(() => Tick(), () => Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId)));
        Assert.All(errors, error => Assert.True(error is null or ConflictException));
        Assert.Equal(1, await closed.NextAsync());
        await closed.AssertNoMoreAsync();
        await Tick();
        Assert.Equal(GameStatus.Results, await Status(setup));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(301)]
    public async Task AddTimeValidatesRange(int seconds)
    {
        var setup = await CreateAsync(QuizKind.OpenText);
        await Start(setup);
        await Assert.ThrowsAsync<DomainValidationException>(() => Flow(f => f.AddTimeAsync(setup.Game.Id, setup.HostId, seconds)));
    }

    [Fact]
    public async Task AddTimeChecksOwnershipDeadlineAndState()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.AddTimeAsync(setup.Game.Id, setup.HostId, 5)));
        await Start(setup);
        await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.AddTimeAsync(setup.Game.Id, "stranger", 5)));
        factory.Clock.Advance(TimeSpan.FromSeconds(30));
        await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.AddTimeAsync(setup.Game.Id, setup.HostId, 5)));
    }

    [Fact]
    public async Task PresenceCountsHostTabsAndReconnectCancelsDeletion()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Start(setup);
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        await Flow(f => f.AddTimeAsync(setup.Game.Id, setup.HostId, 300));
        var presence = factory.Services.GetRequiredService<GamePresence>();
        await presence.HostConnectedAsync(setup.Game.Id, "tab1", () => Task.CompletedTask);
        await presence.HostConnectedAsync(setup.Game.Id, "tab2", () => Task.CompletedTask);
        await presence.DisconnectedAsync(setup.Game.Id, null, "tab1");
        factory.Clock.Advance(TimeSpan.FromSeconds(21));
        await Tick();
        Assert.Equal(GameStatus.Question, await Status(setup));
        await presence.DisconnectedAsync(setup.Game.Id, null, "tab2");
        factory.Clock.Advance(TimeSpan.FromSeconds(19));
        await Tick();
        await presence.HostConnectedAsync(setup.Game.Id, "returned", () => Task.CompletedTask);
        factory.Clock.Advance(TimeSpan.FromSeconds(2));
        await Tick();
        Assert.Equal(GameStatus.Question, await Status(setup));
        await presence.DisconnectedAsync(setup.Game.Id, null, "returned");
        factory.Clock.Advance(TimeSpan.FromSeconds(20));
        await Tick();
        await InScope(async s =>
        {
            var db = s.GetRequiredService<AppDbContext>();
            Assert.False(await db.GameSessionRecords.AnyAsync(g => g.Id == setup.Game.Id, Ct));
            Assert.False(await db.Players.AnyAsync(p => p.GameSessionRecordId == setup.Game.Id, Ct));
            Assert.False(await db.QuizAnswers.AnyAsync(a => a.PlayerId == setup.Player.PlayerId, Ct));
        });
    }

    [Fact]
    public async Task EndedGamesAreKeptAndOrphansAreDeleted()
    {
        var ended = await CreateAsync(QuizKind.OpenText);
        var orphan = await CreateAsync(QuizKind.OpenText);
        await Flow(f => f.EndAsync(ended.Game.Id, ended.HostId));
        await Tick();
        factory.Clock.Advance(TimeSpan.FromSeconds(20));
        await Tick();
        Assert.Equal(GameStatus.Finished, await Status(ended));
        await InScope(async s => Assert.False(await s.GetRequiredService<AppDbContext>()
            .GameSessionRecords.AnyAsync(g => g.Id == orphan.Game.Id, Ct)));
    }

    [Fact]
    public async Task UntimedQuestionsStayOpenAndAwardOnlyBasePoints()
    {
        var (host, hostId) = await factory.CreateHostAsync();
        var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);
        var response = await System.Net.Http.Json.HttpClientJsonExtensions.PostAsJsonAsync(host,
            $"/api/quizzes/{quiz.Id}/questions", ApiClientExtensions.ValidQuestion(QuizKind.QuizChoice) with { TimeLimitSeconds = null }, Ct);
        var question = await response.ReadAsync<QuestionDto>(System.Net.HttpStatusCode.Created);
        var game = await host.CreateGameAsync(quiz.Id);
        var player = await host.JoinAsync(game.Code, "Ann");
        var setup = new Setup(host, hostId, game, player, question);
        await Start(setup);
        var presence = factory.Services.GetRequiredService<GamePresence>();
        await presence.HostConnectedAsync(game.Id, "untimed-host", () => Task.CompletedTask);
        factory.Clock.Advance(TimeSpan.FromMinutes(10));
        await Tick();
        Assert.Equal(GameStatus.Question, await Status(setup));
        await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.AddTimeAsync(game.Id, hostId, 10)));
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        await InScope(async s => Assert.Equal(100, Assert.Single((await s.GetRequiredService<LiveGameService>().LeaderboardAsync(game.Id)).Entries).Total));
    }

    [Fact]
    public async Task OpenTextGroupsAnswersAndUnansweredPlayersShareZeroScoreRank()
    {
        var setup = await CreateAsync(QuizKind.OpenText);
        var bob = await setup.Host.JoinAsync(setup.Game.Code, "Bob");
        var missing = await setup.Host.JoinAsync(setup.Game.Code, "Missing");
        await Start(setup);
        await Submit(setup, new(1, Text: " Kyiv "));
        await InScope(s => s.GetRequiredService<LiveGameService>().SubmitAsync(setup.Game.Id, bob.PlayerId, new(1, Text: "kyiv")));
        await Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId));
        await InScope(async s =>
        {
            var live = s.GetRequiredService<LiveGameService>();
            var results = await live.HostResultsAsync(setup.Game.Id, 1);
            Assert.Equal(2, Assert.Single(results.OpenAnswers!).Count);
            var leaderboard = await live.LeaderboardAsync(setup.Game.Id);
            Assert.Equal(3, leaderboard.Entries.Count);
            Assert.All(leaderboard.Entries, row => { Assert.Equal(0, row.Total); Assert.Equal(1, row.Place); });
            var personal = await live.PlayerResultsAsync(setup.Game.Id, missing.PlayerId, 1, leaderboard);
            Assert.False(personal.Answered);
            Assert.Null(personal.IsCorrect);
            Assert.Equal(0, personal.Points);
        });
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task AnAnswerCanBeReplacedUntilClosingAndReconnectRestoresTheLastChoice(QuizKind kind)
    {
        var setup = await CreateAsync(kind);
        await Start(setup);
        await Submit(setup, Answer(setup, kind));
        factory.Clock.Advance(TimeSpan.FromSeconds(5));
        var replacement = kind == QuizKind.OpenText
            ? new SubmitAnswerRequest(1, Text: "Lviv")
            : new SubmitAnswerRequest(1, setup.Question.Options![1].Id);
        await Submit(setup, replacement);
        await InScope(async s =>
        {
            var live = s.GetRequiredService<LiveGameService>();
            Assert.Equal(replacement, await live.CurrentAnswerAsync(setup.Game.Id, setup.Player.PlayerId, 1));
            Assert.Equal(1, (await live.ProgressAsync(setup.Game.Id, 1)).Answered);
        });
        await Flow(f => f.ShowResultsAsync(setup.Game.Id, setup.HostId));
        await Assert.ThrowsAsync<ConflictException>(() => Submit(setup, Answer(setup, kind)));
        await InScope(async s =>
        {
            var result = await s.GetRequiredService<LiveGameService>().HostResultsAsync(setup.Game.Id, 1);
            Assert.Equal(1, result.Answered);
            if (kind == QuizKind.OpenText) Assert.Equal("Lviv", Assert.Single(result.OpenAnswers!).Text);
            else
            {
                Assert.Equal(0, result.Options![0].Count);
                Assert.Equal(1, result.Options[1].Count);
            }
        });
    }

    [Fact]
    public async Task ChangingBackToCorrectReplacesTheScoreAndRetryingPreservesIt()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Start(setup);
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        factory.Clock.Advance(TimeSpan.FromSeconds(5));
        await Submit(setup, new(1, setup.Question.Options![1].Id));
        factory.Clock.Advance(TimeSpan.FromSeconds(5));
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        var expected = ScoreCalculator.Calculate(QuizKind.QuizChoice, true, setup.Question.BasePoints, 10000, 30000);
        factory.Clock.Advance(TimeSpan.FromSeconds(5));
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        await InScope(async s =>
        {
            var db = s.GetRequiredService<AppDbContext>();
            var answer = await db.QuizAnswers.SingleAsync(a => a.PlayerId == setup.Player.PlayerId, Ct);
            Assert.Equal(expected, answer.Points);
            Assert.Equal(10000, answer.ElapsedMs);
            Assert.Equal(expected, (await db.Players.SingleAsync(p => p.Id == setup.Player.PlayerId, Ct)).TotalScore);
        });
    }

    [Fact]
    public async Task ConcurrentRevisionsKeepOneRowAndTheMatchingTotalScore()
    {
        var setup = await CreateAsync(QuizKind.QuizChoice);
        await Start(setup);
        await Submit(setup, Answer(setup, QuizKind.QuizChoice));
        var errors = await Race(() => Submit(setup, new(1, setup.Question.Options![1].Id)),
            () => Submit(setup, Answer(setup, QuizKind.QuizChoice)));
        Assert.All(errors, error => Assert.Null(error));
        await InScope(async s =>
        {
            var db = s.GetRequiredService<AppDbContext>();
            var answer = await db.QuizAnswers.SingleAsync(a => a.PlayerId == setup.Player.PlayerId, Ct);
            Assert.Equal(answer.Points, (await db.Players.SingleAsync(p => p.Id == setup.Player.PlayerId, Ct)).TotalScore);
        });
    }

    private async Task<Setup> CreateAsync(QuizKind kind)
    {
        var (host, hostId) = await factory.CreateHostAsync();
        var quiz = await host.CreateQuizAsync(kind);
        var question = await host.AddQuestionAsync(quiz.Id, kind);
        var game = await host.CreateGameAsync(quiz.Id);
        var player = await host.JoinAsync(game.Code, "Ann");
        return new(host, hostId, game, player, question);
    }
    private static SubmitAnswerRequest Answer(Setup setup, QuizKind kind) =>
        kind == QuizKind.OpenText ? new(1, Text: "Kyiv") : new(1, setup.Question.Options![0].Id);
    private Task<QuestionViews> Start(Setup setup) => Flow(f => f.StartAsync(setup.Game.Id, setup.HostId));
    private Task Submit(Setup setup, SubmitAnswerRequest request) => InScope(s => s.GetRequiredService<LiveGameService>().SubmitAsync(setup.Game.Id, setup.Player.PlayerId, request));
    private Task<GameStatus> Status(Setup setup) => InScope(s => s.GetRequiredService<AppDbContext>().GameSessionRecords.Where(g => g.Id == setup.Game.Id).Select(g => g.Status).SingleAsync(Ct));
    private async Task Tick()
    {
        using var worker = ActivatorUtilities.CreateInstance<LiveGameWorker>(factory.Services);
        await worker.TickAsync(Ct);
    }
    private Task<T> Flow<T>(Func<IGameFlowService, Task<T>> action) => InScope(s => action(s.GetRequiredService<IGameFlowService>()));
    private async Task<T> InScope<T>(Func<IServiceProvider, Task<T>> action)
    {
        using var scope = factory.Services.CreateScope();
        return await action(scope.ServiceProvider);
    }
    private async Task InScope(Func<IServiceProvider, Task> action)
    {
        using var scope = factory.Services.CreateScope();
        await action(scope.ServiceProvider);
    }
    private static async Task<Exception?[]> Race(Func<Task> first, Func<Task> second)
    {
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        Task<Exception?> Run(Func<Task> action) => Task.Run(async () =>
        {
            await start.Task;
            try { await action(); return null; }
            catch (Exception ex) { return ex; }
        });
        var tasks = new[] { Run(first), Run(second) };
        start.SetResult();
        return await Task.WhenAll(tasks);
    }
}
