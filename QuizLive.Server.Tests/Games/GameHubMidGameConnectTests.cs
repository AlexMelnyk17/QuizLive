using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // A tab opened or a page reloaded in the middle of a game must show the same screen as the others.
    public class GameHubMidGameConnectTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task InTheLobby_ThereIsNoCurrentQuestion()
        {
            var setup = await CreateGameAsync();

            await using var host = await StartAsync(setup.Host.BearerToken());
            var hostState = await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);

            await using var player = await StartAsync();
            var playerState = await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.PlayerToken, Ct);

            Assert.Equal(GameStatus.Lobby, hostState.Game.Status);
            Assert.Null(hostState.CurrentQuestion);
            Assert.Equal(GameStatus.Lobby, playerState.Status);
            Assert.Null(playerState.CurrentQuestion);
        }

        [Fact]
        public async Task AHostTabOpenedDuringAQuestion_GetsTheSameQuestionAsTheFirstTab()
        {
            var setup = await CreateGameAsync();

            await using var firstTab = await StartAsync(setup.Host.BearerToken());
            var firstTabSees = firstTab.Subscribe<HostQuestionDto>("HostQuestionShown");
            await firstTab.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);
            await firstTab.InvokeAsync("StartGame", Ct);
            var shown = await firstTabSees.NextAsync();

            await using var secondTab = await StartAsync(setup.Host.BearerToken());
            var state = await secondTab.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);

            Assert.Equal(GameStatus.Question, state.Game.Status);
            Assert.NotNull(state.CurrentQuestion);
            Assert.Equal(shown.Number, state.CurrentQuestion.Number);
            Assert.Equal(shown.Total, state.CurrentQuestion.Total);
            Assert.Equal(shown.Question.Text, state.CurrentQuestion.Question.Text);
            Assert.Equal(shown.Timing.StartedAtUtc, state.CurrentQuestion.Timing.StartedAtUtc);
            Assert.Equal(shown.Timing.EndsAtUtc, state.CurrentQuestion.Timing.EndsAtUtc);
            Assert.Single(state.CurrentQuestion.Question.Options!, option => option.IsCorrect == true);
            Assert.True(state.CurrentQuestion.Timing.ServerNowUtc >= shown.Timing.StartedAtUtc);
        }

        [Fact]
        public async Task APlayerJoiningDuringAQuestion_GetsTheQuestionWithoutTheCorrectAnswer()
        {
            var setup = await CreateGameAsync();

            await using var host = await StartAsync(setup.Host.BearerToken());
            await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);
            await host.InvokeAsync("StartGame", Ct);

            await using var player = await StartAsync();

            // Read as raw JSON: the correct option must not be in the response in any form.
            var state = await player.InvokeAsync<JsonElement>("ConnectAsPlayer", setup.PlayerToken, Ct);

            Assert.DoesNotContain("isCorrect", state.GetRawText(), StringComparison.OrdinalIgnoreCase);

            var question = state.GetProperty("currentQuestion");
            Assert.Equal(1, question.GetProperty("number").GetInt32());
            Assert.Equal(2, question.GetProperty("options").GetArrayLength());
            Assert.Equal((int)GameStatus.Question, state.GetProperty("status").GetInt32());
        }

        [Fact]
        public async Task WhileTheResultsAreShown_TheQuestionIsStillGiven()
        {
            var setup = await CreateGameAsync();

            await using var host = await StartAsync(setup.Host.BearerToken());
            await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);
            await host.InvokeAsync("StartGame", Ct);
            await host.InvokeAsync("ShowResults", Ct);

            await using var reloaded = await StartAsync(setup.Host.BearerToken());
            var hostState = await reloaded.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);

            await using var player = await StartAsync();
            var playerState = await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.PlayerToken, Ct);

            Assert.Equal(GameStatus.Results, hostState.Game.Status);
            Assert.Equal(1, hostState.CurrentQuestion?.Number);
            Assert.Equal(GameStatus.Results, playerState.Status);
            Assert.Equal(1, playerState.CurrentQuestion?.Number);
        }

        [Fact]
        public async Task AfterTheNextQuestion_ANewConnectionGetsTheNewOne()
        {
            var setup = await CreateGameAsync(questionCount: 2);

            await using var host = await StartAsync(setup.Host.BearerToken());
            await host.InvokeAsync<HostGameStateDto>("ConnectAsHost", setup.Game.Id, Ct);
            await host.InvokeAsync("StartGame", Ct);
            await host.InvokeAsync("ShowResults", Ct);
            await host.InvokeAsync("NextQuestion", Ct);

            await using var player = await StartAsync();
            var state = await player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", setup.PlayerToken, Ct);

            Assert.Equal(GameStatus.Question, state.Status);
            Assert.Equal(2, state.CurrentQuestion?.Number);
            Assert.Equal(2, state.CurrentQuestion?.Total);
        }

        private record GameSetup(HttpClient Host, GameDto Game, string PlayerToken);

        private async Task<GameSetup> CreateGameAsync(int questionCount = 1)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);

            for (var i = 0; i < questionCount; i++)
            {
                await host.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);
            }

            var game = await host.CreateGameAsync(quiz.Id);
            var player = await host.JoinAsync(game.Code, "Ann");

            return new GameSetup(host, game, player.Token);
        }

        private async Task<HubConnection> StartAsync(string? accessToken = null)
        {
            var connection = factory.CreateHubConnection(accessToken);
            await connection.StartAsync(Ct);
            return connection;
        }
    }
}
