using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Database
{
    // The services check these rules first; here the database itself must reject what slips past them.
    public class DatabaseConstraintTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task QuizQuestion_WithSecondCorrectOption_IsRejected()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);
            var question = await host.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);

            await AssertUniqueViolationAsync("QuizOptions.QuizQuestionId", db => db.QuizOptions.Add(
                new QuizOption { QuizQuestionId = question.Id, Order = 3, Text = "Also correct", IsCorrect = true }));
        }

        [Fact]
        public async Task QuizQuestion_WithAnotherWrongOption_IsAllowed()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);
            var question = await host.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);

            await SaveAsync(db => db.QuizOptions.Add(
                new QuizOption { QuizQuestionId = question.Id, Order = 3, Text = "Also wrong", IsCorrect = false }));
        }

        [Fact]
        public async Task ActiveGames_CannotShareCode()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var first = await CreateGameAsync(host);
            var second = await CreateGameAsync(host);

            await AssertUniqueViolationAsync("GameSessionRecords.Code", db => SetCodeAsync(db, second.Id, first.Code));
        }

        [Fact]
        public async Task EndedGames_CanShareCode()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var first = await CreateGameAsync(host);
            var second = await CreateGameAsync(host);
            await EndGameAsync(host, first.Id);

            // An ended game's code can be reused by an active game, and then both games can be ended.
            await SaveAsync(db => SetCodeAsync(db, second.Id, first.Code));
            await EndGameAsync(host, second.Id);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var codes = await db.GameSessionRecords
                .Where(g => g.Id == first.Id || g.Id == second.Id)
                .Select(g => g.Code)
                .ToListAsync(Ct);

            Assert.Equal(new[] { first.Code, first.Code }, codes);
        }

        [Fact]
        public async Task Player_WithTakenNicknameInSameGame_IsRejected()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var game = await CreateGameAsync(host);
            await factory.CreateClient().JoinAsync(game.Code, "Anna");

            await AssertUniqueViolationAsync(
                "Players.GameSessionRecordId, Players.Nickname",
                db => db.Players.Add(new Player { GameSessionRecordId = game.Id, Nickname = "Anna" }));
        }

        [Fact]
        public async Task Player_WithSameNicknameInAnotherGame_IsAllowed()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var game = await CreateGameAsync(host);
            var otherGame = await CreateGameAsync(host);
            await factory.CreateClient().JoinAsync(game.Code, "Anna");

            await SaveAsync(db => db.Players.Add(new Player { GameSessionRecordId = otherGame.Id, Nickname = "Anna" }));
        }

        [Fact]
        public async Task Player_WithTakenToken_IsRejected()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var game = await CreateGameAsync(host);
            var otherGame = await CreateGameAsync(host);
            var player = await factory.CreateClient().JoinAsync(game.Code, "Anna");

            await AssertUniqueViolationAsync("Players.Token", db => db.Players.Add(
                new Player { GameSessionRecordId = otherGame.Id, Nickname = "Bohdan", Token = player.Token }));
        }

        private static async Task<Application.Games.GameDto> CreateGameAsync(HttpClient host)
        {
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            return await host.CreateGameAsync(quiz.Id);
        }

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
        }

        private static async Task SetCodeAsync(AppDbContext db, int gameId, string code)
        {
            var game = await db.GameSessionRecords.SingleAsync(g => g.Id == gameId, Ct);
            game.Code = code;
        }

        private Task SaveAsync(Action<AppDbContext> change) => SaveAsync(db =>
        {
            change(db);
            return Task.CompletedTask;
        });

        private async Task SaveAsync(Func<AppDbContext, Task> change)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await change(db);
            await db.SaveChangesAsync(Ct);
        }

        private Task AssertUniqueViolationAsync(string columns, Action<AppDbContext> change) =>
            AssertUniqueViolationAsync(columns, db =>
            {
                change(db);
                return Task.CompletedTask;
            });

        // The column list in the SQLite message shows which unique index rejected the row.
        private async Task AssertUniqueViolationAsync(string columns, Func<AppDbContext, Task> change)
        {
            var exception = await Assert.ThrowsAsync<DbUpdateException>(() => SaveAsync(change));

            Assert.True(exception.IsUniqueViolation(), exception.InnerException?.Message);
            Assert.Contains($"'UNIQUE constraint failed: {columns}'", exception.InnerException!.Message);
        }
    }
}
