using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
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

        // The hook makes a player join right after the lobby state was read: the snapshot cannot contain
        // that player, so the event is the only way for the client to learn about them.
        [Fact]
        public async Task PlayerWhoJoinsWhileTheHostConnects_IsNotLost()
        {
            var hooks = new GameServiceHooks();
            using var app = WithHooks(hooks);

            var host = await app.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);

            await using var connection = app.CreateHubConnection(host.BearerToken());
            var joined = connection.Subscribe<GamePlayerDto>("PlayerJoined");
            await connection.StartAsync(Ct);

            hooks.AfterStateRead = () => host.JoinAsync(game.Code, "Late");

            var snapshot = await connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);

            Assert.Empty(snapshot.Players);

            var received = await joined.NextAsync();
            Assert.Equal("Late", received.Nickname);
        }

        [Fact]
        public async Task PlayerWhoJoinsWhileAnotherPlayerConnects_IsNotLost()
        {
            var hooks = new GameServiceHooks();
            using var app = WithHooks(hooks);

            var host = await app.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var first = await host.JoinAsync(game.Code, "Ann");

            await using var connection = app.CreateHubConnection();
            var joined = connection.Subscribe<GamePlayerDto>("PlayerJoined");
            await connection.StartAsync(Ct);

            hooks.AfterStateRead = () => host.JoinAsync(game.Code, "Late");

            var state = await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", first.Token, Ct);

            Assert.Equal(["Ann"], state.Players.Select(p => p.Nickname));

            var received = await joined.NextAsync();
            Assert.Equal("Late", received.Nickname);
        }

        private WebApplicationFactory<Program> WithHooks(GameServiceHooks hooks) =>
            factory.WithWebHostBuilder(builder =>
                builder.ConfigureTestServices(services => HookedGameService.Register(services, hooks)));
    }
}
