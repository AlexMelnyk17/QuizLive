using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Realtime;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games;

public class LiveGameHubTests(LiveGameFactory factory) : IClassFixture<LiveGameFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task AnswersArePrivateProgressIsHostOnlyAndResultsArePersonal()
    {
        var client = await factory.CreateAuthorizedClientAsync();
        var quiz = await client.CreateQuizAsync(QuizKind.QuizChoice);
        var question = await client.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);
        var game = await client.CreateGameAsync(quiz.Id);
        var ann = await client.JoinAsync(game.Code, "Ann");
        var bob = await client.JoinAsync(game.Code, "Bob");
        await using var host = factory.CreateHubConnection(client.BearerToken());
        await using var first = factory.CreateHubConnection();
        await using var second = factory.CreateHubConnection();
        await host.StartAsync(Ct);
        await first.StartAsync(Ct);
        await second.StartAsync(Ct);
        await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);
        await first.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        await second.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", bob.Token, Ct);
        var hostProgress = host.Subscribe<AnswerProgressDto>("AnswerProgress");
        var playerProgress = first.Subscribe<AnswerProgressDto>("AnswerProgress");
        var hostResultsForPlayer = first.Subscribe<HostQuestionResultsDto>("HostResults");
        var firstResults = first.Subscribe<PlayerQuestionResultsDto>("PlayerResults");
        var secondResults = second.Subscribe<PlayerQuestionResultsDto>("PlayerResults");
        var timeAdded = second.Subscribe<QuestionTimeAddedDto>("TimeAdded");
        await host.InvokeAsync("StartGame", Ct);
        await host.InvokeAsync("AddTime", 10, Ct);
        Assert.Equal(40, ((await timeAdded.NextAsync()).Timing.EndsAtUtc!.Value - factory.Clock.GetUtcNow().UtcDateTime).TotalSeconds);
        await first.InvokeAsync("SubmitAnswer", new SubmitAnswerRequest(1, question.Options![0].Id), Ct);
        Assert.Equal(1, (await hostProgress.NextAsync()).Answered);
        await second.InvokeAsync("SubmitAnswer", new SubmitAnswerRequest(1, question.Options[1].Id), Ct);
        Assert.Equal(2, (await hostProgress.NextAsync()).Answered);
        await firstResults.AssertNoMoreAsync();
        await secondResults.AssertNoMoreAsync();
        await hostResultsForPlayer.AssertNoMoreAsync();
        await playerProgress.AssertNoMoreAsync();
        await host.InvokeAsync("ShowResults", Ct);
        var correct = await firstResults.NextAsync();
        var wrong = await secondResults.NextAsync();
        Assert.True(correct.IsCorrect);
        Assert.Equal(150, correct.Points);
        Assert.Equal(1, correct.Place);
        Assert.False(wrong.IsCorrect);
        Assert.Equal(0, wrong.Points);
        Assert.Equal(0, wrong.Total);
        Assert.Equal(2, wrong.Place);
        await firstResults.AssertNoMoreAsync();
        await secondResults.AssertNoMoreAsync();
        await hostResultsForPlayer.AssertNoMoreAsync();
    }

    [Fact]
    public async Task HubChecksConnectionRolesAndAllowsAnswerRevisionsWhileOpen()
    {
        var client = await factory.CreateAuthorizedClientAsync();
        var quiz = await client.CreatePlayableQuizAsync(QuizKind.OpenText);
        var game = await client.CreateGameAsync(quiz.Id);
        var ann = await client.JoinAsync(game.Code, "Ann");
        await using var host = factory.CreateHubConnection(client.BearerToken());
        await using var player = factory.CreateHubConnection(client.BearerToken());
        await using var unjoined = factory.CreateHubConnection(client.BearerToken());
        await host.StartAsync(Ct);
        await player.StartAsync(Ct);
        await unjoined.StartAsync(Ct);
        await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);
        await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        var answer = new SubmitAnswerRequest(1, Text: "Kyiv");
        await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("SubmitAnswer", answer, Ct));
        await Assert.ThrowsAsync<HubException>(() => unjoined.InvokeAsync("SubmitAnswer", answer, Ct));
        await Assert.ThrowsAsync<HubException>(() => player.InvokeAsync("AddTime", 10, Ct));
        await Assert.ThrowsAsync<HubException>(() => unjoined.InvokeAsync("AddTime", 10, Ct));
        await host.InvokeAsync("StartGame", Ct);
        await player.InvokeAsync("SubmitAnswer", answer, Ct);
        await player.InvokeAsync("SubmitAnswer", new SubmitAnswerRequest(1, Text: "Lviv"), Ct);
        await using var reconnect = factory.CreateHubConnection();
        await reconnect.StartAsync(Ct);
        var snapshot = await reconnect.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        Assert.Equal("Lviv", snapshot.CurrentAnswer?.Text);
        await host.InvokeAsync("ShowResults", Ct);
        await Assert.ThrowsAsync<HubException>(() => player.InvokeAsync("SubmitAnswer", answer, Ct));
    }

    [Fact]
    public async Task RealDisconnectOnlyMarksPlayerOfflineAfterLastTabAndReconnectRestoresPresence()
    {
        var client = await factory.CreateAuthorizedClientAsync();
        var quiz = await client.CreatePlayableQuizAsync(QuizKind.OpenText);
        var game = await client.CreateGameAsync(quiz.Id);
        var ann = await client.JoinAsync(game.Code, "Ann");
        await using var host = factory.CreateHubConnection(client.BearerToken());
        await host.StartAsync(Ct);
        await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);
        var changes = host.Subscribe<PlayerPresenceDto>("PlayerPresenceChanged");
        var left = host.Subscribe<int>("PlayerLeft");
        await using var first = factory.CreateHubConnection();
        await using var second = factory.CreateHubConnection();
        await first.StartAsync(Ct);
        await first.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        Assert.Equal(new(ann.PlayerId, true), await changes.NextAsync());
        await second.StartAsync(Ct);
        var snapshot = await second.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        Assert.True(Assert.Single(snapshot.Presence!).IsOnline);
        await first.StopAsync(Ct);
        await changes.AssertNoMoreAsync();
        await left.AssertNoMoreAsync();
        await second.StopAsync(Ct);
        Assert.Equal(new(ann.PlayerId, false), await changes.NextAsync());
        Assert.Equal(ann.PlayerId, await left.NextAsync());
        await first.StartAsync(Ct);
        await first.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);
        Assert.True((await changes.NextAsync()).IsOnline);
    }

    [Fact]
    public async Task RealHostDisconnectStartsGracePeriodAndFinishedGameSurvivesIt()
    {
        var client = await factory.CreateAuthorizedClientAsync();
        var quiz = await client.CreatePlayableQuizAsync(QuizKind.OpenText);
        var game = await client.CreateGameAsync(quiz.Id);
        await using var host = factory.CreateHubConnection(client.BearerToken());
        await host.StartAsync(Ct);
        await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);
        await host.InvokeAsync("EndGame", Ct);
        await host.StopAsync(Ct);
        factory.Clock.Advance(TimeSpan.FromSeconds(21));
        using var worker = ActivatorUtilities.CreateInstance<LiveGameWorker>(factory.Services);
        await worker.TickAsync(Ct);
        Assert.True((await client.GetAsync($"/api/games/{game.Id}", Ct)).IsSuccessStatusCode);
    }
}
