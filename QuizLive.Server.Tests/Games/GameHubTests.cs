using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class GameHubTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task ConnectAsPlayer_WithValidToken_ReturnsLobbyState()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var player = await host.JoinAsync(game.Code, "Ann");

            await using var connection = factory.CreateHubConnection();
            await connection.StartAsync(Ct);

            var state = await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", player.Token, Ct);

            Assert.Equal(game.Id, state.GameId);
            Assert.Equal(game.Code, state.Code);
            Assert.Equal(GameStatus.Lobby, state.Status);
            Assert.Equal(player.PlayerId, state.PlayerId);
            Assert.Equal("Ann", state.Nickname);
            Assert.Equal(["Ann"], state.Players.Select(p => p.Nickname));
        }
    }
}
