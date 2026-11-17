using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using QuizLive.Server.Application.Games;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // These tests use the real notifier: events are sent to hub clients, not recorded by the fake.
    public class GameHubEventTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public async Task FailedConnectionToEndingGame_LeavesOldGroupAndAllowsRetry(bool asHost)
        {
            var hooks = new GameServiceHooks();
            using var app = WithHooks(hooks);
            using var host = await app.CreateAuthorizedClientAsync();
            var firstQuiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var secondQuiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var first = await host.CreateGameAsync(firstQuiz.Id);
            var second = await host.CreateGameAsync(secondQuiz.Id);
            var firstPlayer = await host.JoinAsync(first.Code, "First");
            var secondPlayer = await host.JoinAsync(second.Code, "Second");
            await using var connection = app.CreateHubConnection(asHost ? host.BearerToken() : null);
            var joined = connection.Subscribe<GamePlayerDto>(nameof(IGameClient.PlayerJoined));
            await connection.StartAsync(Ct);
            hooks.BeforeStateRead = async () => Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{first.Id}/end", null, Ct)).StatusCode);
            if (asHost)
            {
                await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync<GameDto>("ConnectAsHost", first.Id, Ct));
                await connection.InvokeAsync<GameDto>("ConnectAsHost", second.Id, Ct);
            }
            else
            {
                await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", firstPlayer.Token, Ct));
                await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", secondPlayer.Token, Ct);
            }
            await app.Services.GetRequiredService<IGameNotifier>().PlayerJoinedAsync(first.Id, new GamePlayerDto(99999, "Old group", DateTime.UtcNow));
            var newcomer = await host.JoinAsync(second.Code, "New group");
            var delivered = await joined.NextAsync();
            Assert.Equal(newcomer.PlayerId, delivered.Id);
            Assert.Equal("New group", delivered.Nickname);
        }

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

        [Fact]
        public async Task PlayerJoined_IsDeliveredOnceToTheHostAndOnceToEachPlayer()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var ann = await host.JoinAsync(game.Code, "Ann");

            await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
            var hostSees = hostConnection.Subscribe<GamePlayerDto>("PlayerJoined");
            await hostConnection.StartAsync(Ct);
            await hostConnection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);

            await using var annConnection = factory.CreateHubConnection();
            var annSees = annConnection.Subscribe<GamePlayerDto>("PlayerJoined");
            await annConnection.StartAsync(Ct);
            await annConnection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);

            await host.JoinAsync(game.Code, "Bob");

            Assert.Equal("Bob", (await hostSees.NextAsync()).Nickname);
            Assert.Equal("Bob", (await annSees.NextAsync()).Nickname);

            // A connection that belonged to two groups would receive the event twice.
            await hostSees.AssertNoMoreAsync();
            await annSees.AssertNoMoreAsync();
        }

        [Fact]
        public async Task GameEnded_IsDeliveredOnceToTheHostAndThePlayer_EvenWhenEndedTwice()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var ann = await host.JoinAsync(game.Code, "Ann");

            await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
            var hostSees = hostConnection.Subscribe("GameEnded");
            await hostConnection.StartAsync(Ct);
            await hostConnection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);

            await using var annConnection = factory.CreateHubConnection();
            var annSees = annConnection.Subscribe("GameEnded");
            await annConnection.StartAsync(Ct);
            await annConnection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct);

            Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{game.Id}/end", null, Ct)).StatusCode);
            Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{game.Id}/end", null, Ct)).StatusCode);

            await hostSees.NextAsync();
            await annSees.NextAsync();

            await hostSees.AssertNoMoreAsync();
            await annSees.AssertNoMoreAsync();
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
