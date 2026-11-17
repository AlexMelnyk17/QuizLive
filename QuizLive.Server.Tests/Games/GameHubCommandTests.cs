using System.Net.Http.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // The host's commands over a real hub connection, with the real notifier.
    public class GameHubCommandTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task TheHostDrivesAGameFromTheLobbyToTheEnd()
        {
            var setup = await CreateGameAsync(questionCount: 2);

            await using var host = await ConnectHostAsync(setup);
            var questions = host.Subscribe<HostQuestionDto>("HostQuestionShown");
            var closed = host.Subscribe<int>("QuestionClosed");
            var ended = host.Subscribe("GameEnded");

            await host.InvokeAsync("StartGame", Ct);
            Assert.Equal(1, (await questions.NextAsync()).Number);

            await host.InvokeAsync("ShowResults", Ct);
            Assert.Equal(1, await closed.NextAsync());

            await host.InvokeAsync("NextQuestion", Ct);
            Assert.Equal(2, (await questions.NextAsync()).Number);

            await host.InvokeAsync("ShowResults", Ct);
            Assert.Equal(2, await closed.NextAsync());

            await host.InvokeAsync("NextQuestion", Ct);
            await ended.NextAsync();

            Assert.Equal(GameStatus.Finished, (await GetGameAsync(setup)).Status);

            await ended.AssertNoMoreAsync();
            await questions.AssertNoMoreAsync();
        }

        [Fact]
        public async Task EndGame_KeepsTheProgress_AndTheGameCannotBeDrivenAnyMore()
        {
            var setup = await CreateGameAsync(questionCount: 2);

            await using var host = await ConnectHostAsync(setup);
            var ended = host.Subscribe("GameEnded");
            await host.InvokeAsync("StartGame", Ct);

            await host.InvokeAsync("EndGame", Ct);
            await ended.NextAsync();

            Assert.Equal(GameStatus.Finished, (await GetGameAsync(setup)).Status);

            var error = await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("ShowResults", Ct));
            Assert.Contains(GameMessages.NotFound(setup.Game.Id), error.Message);
        }

        [Fact]
        public async Task ACommandThatDoesNotFitTheState_ReturnsAReadableMessage()
        {
            var setup = await CreateGameAsync(questionCount: 1);

            await using var host = await ConnectHostAsync(setup);

            var error = await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("ShowResults", Ct));
            Assert.Contains(GameMessages.QuestionNotOpen, error.Message);

            await host.InvokeAsync("StartGame", Ct);

            error = await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("StartGame", Ct));
            Assert.Contains(GameMessages.AlreadyStarted, error.Message);

            error = await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("NextQuestion", Ct));
            Assert.Contains(GameMessages.ResultsNotShown, error.Message);
        }

        [Fact]
        public async Task StartGame_WithoutPlayers_ReturnsAReadableMessage()
        {
            var setup = await CreateGameAsync(questionCount: 1, withPlayer: false);

            await using var host = await ConnectHostAsync(setup);

            var error = await Assert.ThrowsAsync<HubException>(() => host.InvokeAsync("StartGame", Ct));
            Assert.Contains(GameMessages.NoPlayers, error.Message);
        }

        [Theory]
        [InlineData("StartGame")]
        [InlineData("ShowResults")]
        [InlineData("NextQuestion")]
        [InlineData("EndGame")]
        public async Task APlayerConnection_CannotSendHostCommands(string command)
        {
            var setup = await CreateGameAsync(questionCount: 1);

            await using var player = factory.CreateHubConnection();
            await player.StartAsync(Ct);
            await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.PlayerToken, Ct);

            await Assert.ThrowsAsync<HubException>(() => player.InvokeAsync(command, Ct));

            Assert.Equal(GameStatus.Lobby, (await GetGameAsync(setup)).Status);
        }

        [Theory]
        [InlineData("StartGame")]
        [InlineData("EndGame")]
        public async Task ALoggedInUserWhoJoinedAsAPlayer_CannotSendHostCommands(string command)
        {
            var setup = await CreateGameAsync(questionCount: 1);

            // The host's own JWT, but the connection joined the game as a player: the role decides.
            await using var connection = factory.CreateHubConnection(setup.Host.BearerToken());
            await connection.StartAsync(Ct);
            await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.PlayerToken, Ct);

            var error = await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync(command, Ct));

            Assert.Contains(GameMessages.HostOnly, error.Message);
            Assert.Equal(GameStatus.Lobby, (await GetGameAsync(setup)).Status);
        }

        [Fact]
        public async Task AConnectionThatJoinedNoGame_CannotSendHostCommands()
        {
            var setup = await CreateGameAsync(questionCount: 1);

            await using var connection = factory.CreateHubConnection(setup.Host.BearerToken());
            await connection.StartAsync(Ct);

            var error = await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync("StartGame", Ct));

            Assert.Contains(GameMessages.HostOnly, error.Message);
        }

        [Fact]
        public async Task ACommandActsOnlyOnTheGameOfItsConnection()
        {
            var first = await CreateGameAsync(questionCount: 1);
            var second = await CreateGameAsync(questionCount: 1);

            await using var host = await ConnectHostAsync(second);
            await host.InvokeAsync("StartGame", Ct);

            Assert.Equal(GameStatus.Question, (await GetGameAsync(second)).Status);
            Assert.Equal(GameStatus.Lobby, (await GetGameAsync(first)).Status);
        }

        [Fact]
        public async Task TwoHostTabsSendingTheSameCommand_AdvanceTheGameOnce()
        {
            var setup = await CreateGameAsync(questionCount: 3);

            await using var firstTab = await ConnectHostAsync(setup);
            await using var secondTab = await ConnectHostAsync(setup);
            var questions = firstTab.Subscribe<HostQuestionDto>("HostQuestionShown");

            await firstTab.InvokeAsync("StartGame", Ct);
            await questions.NextAsync();
            await firstTab.InvokeAsync("ShowResults", Ct);

            var attempts = await Task.WhenAll(
                TryInvokeAsync(firstTab, "NextQuestion"),
                TryInvokeAsync(secondTab, "NextQuestion"));

            Assert.Single(attempts, error => error is null);
            var rejected = Assert.Single(attempts, error => error is not null);
            Assert.Contains(GameMessages.ResultsNotShown, rejected!.Message);

            Assert.Equal(2, (await questions.NextAsync()).Number);
            await questions.AssertNoMoreAsync();
        }

        private record GameSetup(HttpClient Host, GameDto Game, string PlayerToken);

        private async Task<GameSetup> CreateGameAsync(int questionCount, bool withPlayer = true)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);

            for (var i = 0; i < questionCount; i++)
            {
                await host.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);
            }

            var game = await host.CreateGameAsync(quiz.Id);
            var playerToken = withPlayer ? (await host.JoinAsync(game.Code, "Ann")).Token : string.Empty;

            return new GameSetup(host, game, playerToken);
        }

        private async Task<HubConnection> ConnectHostAsync(GameSetup setup)
        {
            var connection = factory.CreateHubConnection(setup.Host.BearerToken());
            await connection.StartAsync(Ct);
            await connection.InvokeAsync<GameDto>("ConnectAsHost", setup.Game.Id, Ct);
            return connection;
        }

        private async Task<GameDto> GetGameAsync(GameSetup setup) =>
            (await setup.Host.GetFromJsonAsync<GameDto>($"/api/games/{setup.Game.Id}", Ct))!;

        private static async Task<HubException?> TryInvokeAsync(HubConnection connection, string command)
        {
            try
            {
                await connection.InvokeAsync(command, Ct);
                return null;
            }
            catch (HubException ex)
            {
                return ex;
            }
        }
    }
}
