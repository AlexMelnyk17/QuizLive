using System.Net;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Stats
{
    public class HostStatsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task GetStats_WithoutToken_Returns401()
        {
            var response = await factory.CreateClient().GetAsync("/api/stats", Ct);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetStats_ForHostWithoutGames_ReturnsZeroPlayers()
        {
            var host = await factory.CreateAuthorizedClientAsync();

            var stats = await GetStatsAsync(host);

            Assert.Equal(new PlayerStatsDto(0, 0m, 0), stats.Players);
        }

        // A game without players makes the "max players in one game" query run over an empty set.
        [Fact]
        public async Task GetStats_ForGameWithoutPlayers_ReturnsZeroPlayers()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            await host.CreateGameAsync(quiz.Id);

            var stats = await GetStatsAsync(host);

            Assert.Equal(1, stats.Games.Total);
            Assert.Equal(new PlayerStatsDto(0, 0m, 0), stats.Players);
        }

        [Fact]
        public async Task GetStats_CountsPlayersOfOwnGamesOnly()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var firstQuiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var secondQuiz = await host.CreatePlayableQuizAsync(QuizKind.PollChoice);
            var firstGame = await host.CreateGameAsync(firstQuiz.Id);
            var secondGame = await host.CreateGameAsync(secondQuiz.Id);
            var otherHost = await factory.CreateAuthorizedClientAsync();
            var otherQuiz = await otherHost.CreatePlayableQuizAsync(QuizKind.OpenText);
            var otherGame = await otherHost.CreateGameAsync(otherQuiz.Id);

            foreach (var nickname in new[] { "Anna", "Bohdan", "Chen" })
            {
                await factory.CreateClient().JoinAsync(firstGame.Code, nickname);
            }

            await factory.CreateClient().JoinAsync(secondGame.Code, "Dana");
            await factory.CreateClient().JoinAsync(otherGame.Code, "Eve");

            var stats = await GetStatsAsync(host);

            Assert.Equal(2, stats.Games.Total);
            Assert.Equal(new PlayerStatsDto(4, 2m, 3), stats.Players);
        }

        private static async Task<HostStatsDto> GetStatsAsync(HttpClient host)
        {
            var response = await host.GetAsync("/api/stats", Ct);
            return await response.ReadAsync<HostStatsDto>(HttpStatusCode.OK);
        }
    }
}
