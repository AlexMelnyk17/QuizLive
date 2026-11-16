using System.Net;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class GamesListTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task GetGames_WithoutToken_Returns401()
        {
            var response = await factory.CreateClient().GetAsync("/api/games", Ct);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetGames_ForNewUser_ReturnsEmptyList()
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var games = await GetGamesAsync(client);

            Assert.Empty(games);
        }

        [Fact]
        public async Task GetGames_ReturnsOnlyOwnGames()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var otherHost = await factory.CreateAuthorizedClientAsync();
            var ownGame = await CreateGameAsync(host);
            await CreateGameAsync(otherHost);

            var games = await GetGamesAsync(host);

            var game = Assert.Single(games);
            Assert.Equal(ownGame.Id, game.Id);
        }

        [Fact]
        public async Task GetGames_WithAnotherUsersQuizId_ReturnsEmptyList()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var otherHost = await factory.CreateAuthorizedClientAsync();
            await CreateGameAsync(host);
            var otherGame = await CreateGameAsync(otherHost);

            var games = await GetGamesAsync(host, $"?quizId={otherGame.QuizId}");

            Assert.Empty(games);
        }

        [Fact]
        public async Task GetGames_FilteredByQuizId_ReturnsOnlyGamesOfThatQuiz()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            var firstGame = await host.CreateGameAsync(quiz.Id);
            await EndGameAsync(host, firstGame.Id);
            var secondGame = await host.CreateGameAsync(quiz.Id);
            await CreateGameAsync(host);

            var games = await GetGamesAsync(host, $"?quizId={quiz.Id}");

            Assert.Equal(
                new[] { firstGame.Id, secondGame.Id }.Order(),
                games.Select(g => g.Id).Order());
        }

        [Theory]
        [InlineData(GameStatus.Lobby)]
        [InlineData(GameStatus.Finished)]
        public async Task GetGames_FilteredByStatus_ReturnsOnlyGamesInThatStatus(GameStatus status)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var endedGame = await CreateGameAsync(host);
            await EndGameAsync(host, endedGame.Id);
            var activeGame = await CreateGameAsync(host);

            var games = await GetGamesAsync(host, $"?status={status}");

            var game = Assert.Single(games);
            Assert.Equal(status == GameStatus.Finished ? endedGame.Id : activeGame.Id, game.Id);
            Assert.Equal(status, game.Status);
        }

        [Fact]
        public async Task GetGames_FilteredByQuizIdAndStatus_AppliesBothFilters()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.PollChoice);
            var endedGame = await host.CreateGameAsync(quiz.Id);
            await EndGameAsync(host, endedGame.Id);
            await host.CreateGameAsync(quiz.Id);
            var otherEndedGame = await CreateGameAsync(host);
            await EndGameAsync(host, otherEndedGame.Id);

            var games = await GetGamesAsync(host, $"?quizId={quiz.Id}&status={GameStatus.Finished}");

            var game = Assert.Single(games);
            Assert.Equal(endedGame.Id, game.Id);
        }

        [Theory]
        [InlineData("abc")]
        [InlineData("999")]
        public async Task GetGames_WithUnknownStatus_Returns400(string status)
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.GetAsync($"/api/games?status={status}", Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "status");
        }

        [Fact]
        public async Task GetGames_ReturnsNewestFirst()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var olderGame = await CreateGameAsync(host);
            var newerGame = await CreateGameAsync(host);

            var games = await GetGamesAsync(host);

            Assert.Equal(new[] { newerGame.Id, olderGame.Id }, games.Select(g => g.Id));
        }

        [Fact]
        public async Task GetGames_ReturnsSummaryOfEachGame()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.PollChoice, "History");
            await host.AddQuestionAsync(quiz.Id, QuizKind.PollChoice);
            var created = await host.CreateGameAsync(quiz.Id);
            await factory.CreateClient().JoinAsync(created.Code, "Anna");
            await factory.CreateClient().JoinAsync(created.Code, "Bohdan");

            var games = await GetGamesAsync(host);

            var game = Assert.Single(games);
            Assert.Equal(created.Id, game.Id);
            Assert.Equal(created.Code, game.Code);
            Assert.Equal(quiz.Id, game.QuizId);
            Assert.Equal("History", game.QuizTitle);
            Assert.Equal(QuizKind.PollChoice, game.QuizKind);
            Assert.Equal(GameStatus.Lobby, game.Status);
            Assert.Null(game.EndedAtUtc);
            Assert.Equal(2, game.PlayerCount);
        }

        private static async Task<List<GameSummaryDto>> GetGamesAsync(HttpClient client, string query = "")
        {
            var response = await client.GetAsync($"/api/games{query}", Ct);
            return await response.ReadAsync<List<GameSummaryDto>>(HttpStatusCode.OK);
        }

        private static async Task<GameDto> CreateGameAsync(HttpClient host)
        {
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            return await host.CreateGameAsync(quiz.Id);
        }

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
    }
}
