using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Auth;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Database;

public class StatsDemoSeederTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SeedStats_CreatesValidHistory_IsIdempotent_AndPreservesExistingCredentials(bool existingUser)
    {
        using var factory = new QuizLiveFactory();
        string? existingUserId = null;
        using var client = factory.CreateClient();
        if (existingUser) existingUserId = (await client.RegisterAsync("quizzer")).User.Id;

        Assert.Equal(0, await Program.Main(["db", "seed-stats", $"--ConnectionStrings:Default=Data Source={factory.DatabasePath}"]));

        int gameCount;
        int playerCount;
        int answerCount;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var owner = await db.Users.SingleAsync(user => user.NormalizedUserName == "QUIZZER", Ct);
            if (existingUser) Assert.Equal(existingUserId, owner.Id);
            var quizzes = await db.Quizzes.Where(quiz => quiz.OwnerId == owner.Id).ToListAsync(Ct);
            Assert.Equal(12, quizzes.Count);
            Assert.All(quizzes, quiz => Assert.StartsWith(StatsDemoSeeder.TitlePrefix, quiz.Title));
            Assert.All(Enum.GetValues<QuizKind>(), kind => Assert.Equal(4, quizzes.Count(quiz => quiz.Kind == kind)));
            var games = await db.GameSessionRecords.Include(game => game.Players).ToListAsync(Ct);
            Assert.All(quizzes, quiz => Assert.InRange(games.Count(game => game.QuizId == quiz.Id), 14, 21));
            Assert.All(games, game =>
            {
                Assert.Equal(owner.Id, game.HostUserId);
                Assert.Equal(GameStatus.Finished, game.Status);
                Assert.True(game.EndedAtUtc > game.CreatedAtUtc);
                Assert.True(game.StartedAtUtc > game.CreatedAtUtc);
                Assert.InRange(game.Players.Count, 5, 15);
                Assert.Equal(game.Players.Count, game.Players.Select(player => player.Nickname).Distinct(StringComparer.OrdinalIgnoreCase).Count());
            });
            var scored = await db.QuizAnswers.Include(answer => answer.Option).Include(answer => answer.Question).Include(answer => answer.Player).ThenInclude(player => player.GameSession).ToListAsync(Ct);
            Assert.NotEmpty(scored);
            Assert.All(scored, answer =>
            {
                Assert.Equal(answer.Question.QuizId, answer.Player.GameSession.QuizId);
                Assert.Equal(answer.QuizQuestionId, answer.Option.QuizQuestionId);
                Assert.Equal(answer.Option.IsCorrect, answer.IsCorrect);
                Assert.Equal(answer.IsCorrect ? 100 : 0, answer.Points);
                Assert.InRange(answer.ElapsedMs!.Value, 3000, 17999);
            });
            var polls = await db.PollAnswers.Include(answer => answer.Option).Include(answer => answer.Question).Include(answer => answer.Player).ThenInclude(player => player.GameSession).ToListAsync(Ct);
            Assert.NotEmpty(polls);
            Assert.All(polls, answer =>
            {
                Assert.Equal(answer.Question.QuizId, answer.Player.GameSession.QuizId);
                Assert.Equal(answer.PollQuestionId, answer.Option.PollQuestionId);
            });
            var texts = await db.OpenAnswers.Include(answer => answer.Question).Include(answer => answer.Player).ThenInclude(player => player.GameSession).ToListAsync(Ct);
            Assert.NotEmpty(texts);
            Assert.All(texts, answer =>
            {
                Assert.Equal(answer.Question.QuizId, answer.Player.GameSession.QuizId);
                Assert.InRange(answer.Text.Length, 1, 200);
            });
            gameCount = games.Count;
            playerCount = await db.Players.CountAsync(Ct);
            answerCount = scored.Count + polls.Count + texts.Count;
        }

        Assert.Equal(0, await Program.Main(["db", "seed-stats", $"--ConnectionStrings:Default=Data Source={factory.DatabasePath}"]));

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(1, await db.Users.CountAsync(Ct));
            Assert.Equal(12, await db.Quizzes.CountAsync(Ct));
            Assert.Equal(gameCount, await db.GameSessionRecords.CountAsync(Ct));
            Assert.Equal(playerCount, await db.Players.CountAsync(Ct));
            Assert.Equal(answerCount, await db.QuizAnswers.CountAsync(Ct) + await db.PollAnswers.CountAsync(Ct) + await db.OpenAnswers.CountAsync(Ct));
        }
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("quizzer", existingUser ? ApiClientExtensions.Password : "quiz123"), Ct);
        await login.ReadAsync<AuthResponse>(HttpStatusCode.OK);
    }
}
