using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // These tests use the real notifier: events are sent to hub clients, not recorded by the fake.
    public class GameHubEventTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task PlayerJoinedThroughRest_IsDeliveredToTheConnectedHost()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);

            await using var connection = factory.CreateHubConnection(host.BearerToken());
            var joined = connection.Subscribe<GamePlayerDto>("PlayerJoined");
            await connection.StartAsync(Ct);
            await connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);

            var player = await host.JoinAsync(game.Code, "Ann");

            var received = await joined.NextAsync();

            Assert.Equal(player.PlayerId, received.Id);
            Assert.Equal("Ann", received.Nickname);
        }
    }
}
