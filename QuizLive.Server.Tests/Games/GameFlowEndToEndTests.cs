using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // A whole game over real hub connections, as the clients will play it: the host drives it with commands,
    // two players watch it. The same game is played for every quiz kind.
    public class GameFlowEndToEndTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
    {
        private const int QuestionCount = 2;

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Theory]
        [InlineData(QuizKind.OpenText, 0)]
        [InlineData(QuizKind.PollChoice, 2)]
        [InlineData(QuizKind.QuizChoice, 2)]
        public async Task AGameIsPlayedFromTheLobbyToTheEnd(QuizKind kind, int optionCount)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(kind);

            for (var i = 0; i < QuestionCount; i++)
            {
                await host.AddQuestionAsync(quiz.Id, kind);
            }

            var game = await host.CreateGameAsync(quiz.Id);
            var ann = await host.JoinAsync(game.Code, "Ann");
            var bob = await host.JoinAsync(game.Code, "Bob");

            await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
            var hostQuestions = hostConnection.Subscribe<HostQuestionDto>("HostQuestionShown");
            var hostClosed = hostConnection.Subscribe<int>("QuestionClosed");
            var hostEnded = hostConnection.Subscribe("GameEnded");
            var results = hostConnection.Subscribe<HostQuestionResultsDto>("HostResults");
            var progress = hostConnection.Subscribe<AnswerProgressDto>("AnswerProgress");
            var leaderboard = hostConnection.Subscribe<LeaderboardDto>("Leaderboard");
            await hostConnection.StartAsync(Ct);
            await hostConnection.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);

            await using var annSide = await ConnectPlayerAsync(ann.Token);
            await using var bobSide = await ConnectPlayerAsync(bob.Token);
            var players = new[] { annSide, bobSide };

            // The lobby is closed once the game starts.
            await hostConnection.InvokeAsync("StartGame", Ct);
            var late = await host.PostAsJsonAsync($"/api/games/code/{game.Code}/players", new JoinGameRequest("Late"), Ct);
            var rejected = await ProblemAssert.HasStatusAsync(late, HttpStatusCode.Conflict);
            Assert.Equal(GameMessages.AlreadyStarted, rejected.Detail);

            for (var number = 1; number <= QuestionCount; number++)
            {
                var forHost = await hostQuestions.NextAsync();
                Assert.Equal(number, forHost.Number);
                Assert.Equal(QuestionCount, forHost.Total);
                Assert.Equal(optionCount, forHost.Question.Options?.Count ?? 0);
                Assert.Equal(
                    kind == QuizKind.QuizChoice ? 1 : 0,
                    forHost.Question.Options?.Count(option => option.IsCorrect == true) ?? 0);

                foreach (var player in players)
                {
                    var forPlayer = await player.Questions.NextAsync();
                    Assert.Equal(number, forPlayer.Number);
                    Assert.Equal(forHost.Question.Text, forPlayer.Text);
                    Assert.Equal(optionCount, forPlayer.Options?.Count ?? 0);
                    var request = kind == QuizKind.OpenText
                        ? new SubmitAnswerRequest(number, Text: " Kyiv ")
                        : new SubmitAnswerRequest(number, forHost.Question.Options!.First(o => o.IsCorrect != false).Id);
                    await player.Connection.InvokeAsync("SubmitAnswer", request, Ct);
                    var received = await progress.NextAsync();
                    Assert.Equal(number, received.Number);
                    Assert.Equal(2, received.Players);
                    Assert.InRange(received.Answered, 1, 2);
                }

                await hostConnection.InvokeAsync("ShowResults", Ct);

                Assert.Equal(number, await hostClosed.NextAsync());
                var hostResult = await results.NextAsync();
                Assert.Equal(2, hostResult.Answered);
                if (kind == QuizKind.OpenText) Assert.Equal(2, Assert.Single(hostResult.OpenAnswers!).Count);
                else Assert.Equal(2, hostResult.Options!.Sum(o => o.Count));
                Assert.False((await leaderboard.NextAsync()).IsFinal);

                foreach (var player in players)
                {
                    Assert.Equal(number, await player.Closed.NextAsync());
                    var personal = await player.Results.NextAsync();
                    Assert.True(personal.Answered);
                    Assert.Equal(kind == QuizKind.QuizChoice ? true : (bool?)null, personal.IsCorrect);
                    Assert.Equal(kind == QuizKind.QuizChoice, personal.Points > 0);
                    Assert.False((await player.Leaderboard.NextAsync()).IsFinal);
                }

                await hostConnection.InvokeAsync("NextQuestion", Ct);
            }

            await hostEnded.NextAsync();
            var final = await leaderboard.NextAsync();
            Assert.True(final.IsFinal);
            Assert.Equal(2, final.Entries.Count);
            Assert.All(final.Entries, p => Assert.Equal(kind == QuizKind.QuizChoice, p.Total > 0));

            foreach (var player in players)
            {
                await player.Ended.NextAsync();
                Assert.True((await player.Leaderboard.NextAsync()).IsFinal);
            }

            // Everything arrived once: nothing is left in any queue.
            await hostQuestions.AssertNoMoreAsync();
            await hostClosed.AssertNoMoreAsync();
            await hostEnded.AssertNoMoreAsync();

            foreach (var player in players)
            {
                await player.Questions.AssertNoMoreAsync();
                await player.Closed.AssertNoMoreAsync();
                await player.Ended.AssertNoMoreAsync();
            }

            // The game is over: it is kept as finished, its code is free and the quiz can be played again.
            var saved = await host.GetFromJsonAsync<GameDto>($"/api/games/{game.Id}", Ct);
            Assert.Equal(GameStatus.Finished, saved!.Status);
            Assert.NotNull(saved.EndedAtUtc);

            var lookup = await host.GetAsync($"/api/games/code/{game.Code}", Ct);
            await ProblemAssert.HasStatusAsync(lookup, HttpStatusCode.NotFound);

            var next = await host.CreateGameAsync(quiz.Id);
            Assert.NotEqual(game.Id, next.Id);
        }

        [Fact]
        public async Task AFinishedGame_CannotBeJoinedAgain()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var ann = await host.JoinAsync(game.Code, "Ann");

            await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
            await hostConnection.StartAsync(Ct);
            await hostConnection.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct);
            await hostConnection.InvokeAsync("StartGame", Ct);
            await hostConnection.InvokeAsync("ShowResults", Ct);
            await hostConnection.InvokeAsync("NextQuestion", Ct);

            await using var player = factory.CreateHubConnection();
            await player.StartAsync(Ct);

            await Assert.ThrowsAsync<Microsoft.AspNetCore.SignalR.HubException>(
                () => player.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", ann.Token, Ct));

            await using var lateHost = factory.CreateHubConnection(host.BearerToken());
            await lateHost.StartAsync(Ct);

            await Assert.ThrowsAsync<Microsoft.AspNetCore.SignalR.HubException>(
                () => lateHost.InvokeAsync<HostGameStateDto>("ConnectAsHost", game.Id, Ct));
        }

        private async Task<PlayerSide> ConnectPlayerAsync(string token)
        {
            var connection = factory.CreateHubConnection();
            var side = new PlayerSide(
                connection,
                connection.Subscribe<PlayerQuestionDto>("QuestionShown"),
                connection.Subscribe<int>("QuestionClosed"),
                connection.Subscribe("GameEnded"),
                connection.Subscribe<PlayerQuestionResultsDto>("PlayerResults"),
                connection.Subscribe<LeaderboardDto>("Leaderboard"));

            await connection.StartAsync(Ct);
            await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", token, Ct);

            return side;
        }

        private sealed record PlayerSide(
            HubConnection Connection,
            HubEventQueue<PlayerQuestionDto> Questions,
            HubEventQueue<int> Closed,
            HubEventQueue<bool> Ended,
            HubEventQueue<PlayerQuestionResultsDto> Results,
            HubEventQueue<LeaderboardDto> Leaderboard) : IAsyncDisposable
        {
            public ValueTask DisposeAsync() => Connection.DisposeAsync();
        }
    }
}
