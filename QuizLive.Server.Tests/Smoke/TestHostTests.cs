using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using QuizLive.Server.Application.Auth;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Auth;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Smoke
{
    public class TestHostTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task ProtectedEndpoint_WithoutToken_Returns401()
        {
            var client = factory.CreateClient();

            var response = await client.GetAsync("/api/quizzes", Ct);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        // A connection string in appsettings.Local.json would win over the test one and point tests at a real database.
        [Fact]
        public void App_UsesTemporaryDatabase()
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            Assert.Equal($"Data Source={factory.DatabasePath}", db.Database.GetConnectionString());
            Assert.True(File.Exists(factory.DatabasePath));
        }

        [Fact]
        public void App_UsesTestJwtKey()
        {
            var options = factory.Services.GetRequiredService<IOptions<JwtOptions>>();

            Assert.Equal(QuizLiveFactory.JwtKey, options.Value.Key);
        }

        [Fact]
        public async Task Database_IsMigrated()
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var pending = await db.Database.GetPendingMigrationsAsync(Ct);

            Assert.Empty(pending);
        }

        [Fact]
        public async Task Database_EnforcesForeignKeys()
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Database.OpenConnectionAsync(Ct);

            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "PRAGMA foreign_keys;";

            Assert.Equal(1L, await command.ExecuteScalarAsync(Ct));
        }

        [Fact]
        public async Task AuthorizedClient_CanCallProtectedEndpoint()
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.GetAsync("/api/auth/me", Ct);
            var user = await response.ReadAsync<UserDto>(HttpStatusCode.OK);

            Assert.False(string.IsNullOrEmpty(user.UserName));
        }

        [Theory]
        [InlineData(QuizKind.OpenText)]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task Helpers_CreateGameThatPlayersCanJoin(QuizKind kind)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(kind);
            var game = await host.CreateGameAsync(quiz.Id);

            var player = await factory.CreateClient().JoinAsync(game.Code, "Player");

            Assert.Equal(game.Id, player.GameId);
            var joined = Assert.Single(factory.Notifier.EventsFor(game.Id));
            Assert.Equal(nameof(IGameClient.PlayerJoined), joined.Name);
        }

        [Fact]
        public async Task ProblemAssert_FindsValidationErrorIgnoringCase()
        {
            var client = factory.CreateClient();

            var response = await client.PostAsJsonAsync("/api/auth/register", new { userName = "", password = "secret1" }, Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "userName");
        }
    }
}
