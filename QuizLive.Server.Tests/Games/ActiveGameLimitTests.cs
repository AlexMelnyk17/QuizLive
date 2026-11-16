using System.Net;
using System.Net.Http.Json;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class ActiveGameLimitTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private const string ActiveGameExists = "The quiz already has an active game.";

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task CreateGame_WhenQuizHasActiveGame_Returns409()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            await host.CreateGameAsync(quiz.Id);

            var response = await PostGameAsync(host, quiz.Id);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(ActiveGameExists, problem.Detail);
        }

        [Fact]
        public async Task CreateGame_AfterActiveGameEnded_Returns201()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var endedGame = await host.CreateGameAsync(quiz.Id);
            await EndGameAsync(host, endedGame.Id);

            var game = await host.CreateGameAsync(quiz.Id);

            Assert.NotEqual(endedGame.Id, game.Id);
            Assert.Equal(GameStatus.Lobby, game.Status);
        }

        [Fact]
        public async Task CreateGame_ConcurrentRequests_OnlyOneSucceeds()
        {
            const int requestCount = 5;
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.PollChoice);

            var responses = await Task.WhenAll(Enumerable.Range(0, requestCount).Select(_ => PostGameAsync(host, quiz.Id)));

            Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Created);
            Assert.Equal(requestCount - 1, responses.Count(r => r.StatusCode == HttpStatusCode.Conflict));
        }

        private static Task<HttpResponseMessage> PostGameAsync(HttpClient host, int quizId) =>
            host.PostAsJsonAsync("/api/games", new CreateGameRequest(quizId), Ct);

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
    }
}
