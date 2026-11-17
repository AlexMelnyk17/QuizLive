using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Regressions;

public class PersistenceFailureTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(2067, 1, HttpStatusCode.Created, 2)]
    [InlineData(2067, 4, HttpStatusCode.Created, 5)]
    [InlineData(2067, 5, HttpStatusCode.InternalServerError, 5)]
    [InlineData(787, 1, HttpStatusCode.InternalServerError, 1)]
    public async Task CreateGame_RetriesOnlyUniqueCollisions_WithBoundedAttempts(int sqliteCode, int failures, HttpStatusCode status, int attempts)
    {
        using var factory = new QuizLiveFactory();
        var fault = new FailingSaveInterceptor(SaveTarget.Game, sqliteCode, failures);
        using var app = WithFault(factory, fault);
        using var host = await app.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);

        var response = await host.PostAsJsonAsync("/api/games", new CreateGameRequest(quiz.Id), Ct);

        Assert.Equal(status, response.StatusCode);
        Assert.Equal(attempts, fault.Attempts);
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(status == HttpStatusCode.Created ? 1 : 0, await db.GameSessionRecords.CountAsync(Ct));
        if (status == HttpStatusCode.InternalServerError)
        {
            var problem = await ProblemAssert.HasStatusAsync(response, status);
            Assert.Null(problem.Detail);
        }
    }

    [Fact]
    public async Task CreateGame_WhenAnotherRequestWinsBetweenCheckAndSave_Returns409()
    {
        using var factory = new QuizLiveFactory();
        var fault = new FailingSaveInterceptor(SaveTarget.Game, 2067, 1)
        {
            BeforeFailure = async context =>
            {
                var pending = context.ChangeTracker.Entries<GameSessionRecord>().Single(entry => entry.State == EntityState.Added).Entity;
                await using var other = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(context.Database.GetConnectionString()).Options);
                other.GameSessionRecords.Add(new GameSessionRecord { QuizId = pending.QuizId, HostUserId = pending.HostUserId, Code = "RACE01" });
                await other.SaveChangesAsync(Ct);
            }
        };
        using var app = WithFault(factory, fault);
        using var host = await app.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);

        var response = await host.PostAsJsonAsync("/api/games", new CreateGameRequest(quiz.Id), Ct);

        var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
        Assert.Equal("The quiz already has an active game.", problem.Detail);
        Assert.Equal(1, fault.Attempts);
        using var scope = app.Services.CreateScope();
        Assert.Equal("RACE01", (await scope.ServiceProvider.GetRequiredService<AppDbContext>().GameSessionRecords.SingleAsync(Ct)).Code);
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task CreateQuestion_WithConcurrentOrderCollision_Returns409AndCanBeRetried(QuizKind kind)
    {
        using var factory = new QuizLiveFactory();
        var fault = new FailingSaveInterceptor(SaveTarget.Question, 2067, 1);
        using var app = WithFault(factory, fault);
        using var host = await app.CreateAuthorizedClientAsync();
        var quiz = await host.CreateQuizAsync(kind);

        var failed = await host.PostAsJsonAsync($"/api/quizzes/{quiz.Id}/questions", ApiClientExtensions.ValidQuestion(kind), Ct);

        var problem = await ProblemAssert.HasStatusAsync(failed, HttpStatusCode.Conflict);
        Assert.Equal(QuizMessages.ChangedConcurrently, problem.Detail);
        var question = await host.AddQuestionAsync(quiz.Id, kind);
        Assert.Equal(1, question.Order);
        var details = await (await host.GetAsync($"/api/quizzes/{quiz.Id}", Ct)).ReadAsync<QuizDetailsDto>(HttpStatusCode.OK);
        Assert.Equal(question.Id, Assert.Single(details.Questions).Id);
    }

    [Fact]
    public async Task Join_WithConcurrentNicknameCollision_Returns409WithoutPlayerOrNotification_AndCanBeRetried()
    {
        using var factory = new QuizLiveFactory();
        var fault = new FailingSaveInterceptor(SaveTarget.Player, 2067, 1);
        using var app = WithFault(factory, fault);
        using var host = await app.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(QuizKind.PollChoice);
        var game = await host.CreateGameAsync(quiz.Id);

        var failed = await host.PostAsJsonAsync($"/api/games/code/{game.Code}/players", new JoinGameRequest("Anna"), Ct);

        var problem = await ProblemAssert.HasStatusAsync(failed, HttpStatusCode.Conflict);
        Assert.Contains("already taken", problem.Detail);
        Assert.Empty(factory.Notifier.EventsFor(game.Id));
        var before = await (await host.GetAsync($"/api/games/{game.Id}", Ct)).ReadAsync<GameDto>(HttpStatusCode.OK);
        Assert.Empty(before.Players);
        var joined = await host.JoinAsync(game.Code, "Anna");
        Assert.Equal("Anna", joined.Nickname);
        Assert.Equal(nameof(IGameClient.PlayerJoined), Assert.Single(factory.Notifier.EventsFor(game.Id)).Name);
    }

    [Fact]
    public async Task JoinService_WithWhitespaceNickname_ReturnsFieldValidationBeforeDatabaseLookup()
    {
        using var factory = new QuizLiveFactory();
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IGameService>();

        var error = await Assert.ThrowsAsync<DomainValidationException>(() => service.JoinAsync("ABC123", new JoinGameRequest("  ")));

        Assert.Equal("Nickname is required.", Assert.Single(error.Errors!["nickname"]));
    }

    private static WebApplicationFactory<Program> WithFault(QuizLiveFactory factory, FailingSaveInterceptor fault) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options
                .UseSqlite($"Data Source={factory.DatabasePath}")
                .AddInterceptors(new SqlitePragmaConnectionInterceptor(), fault));
        }));

    private enum SaveTarget { Game, Player, Question }

    // Controlled database failures make retry/conflict tests independent of scheduler timing.
    private sealed class FailingSaveInterceptor(SaveTarget target, int code, int failures) : SaveChangesInterceptor
    {
        private int remaining = failures;
        public int Attempts { get; private set; }
        public Func<DbContext, Task>? BeforeFailure { get; init; }

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var db = eventData.Context!;
            if (!db.ChangeTracker.Entries().Any(entry => entry.State == EntityState.Added && (target switch
                { SaveTarget.Game => entry.Entity is GameSessionRecord, SaveTarget.Player => entry.Entity is Player, _ => entry.Entity is Question }))) return result;
            Attempts++;
            if (remaining-- <= 0) return result;
            if (BeforeFailure is not null) await BeforeFailure(db);
            throw new DbUpdateException("Injected database failure", new SqliteException("constraint", 19, code));
        }
    }
}
