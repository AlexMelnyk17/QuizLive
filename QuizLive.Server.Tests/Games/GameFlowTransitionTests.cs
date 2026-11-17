using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // These tests call the service directly, as the hub will: every call gets its own scope and DbContext.
    public class GameFlowTransitionTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task ShowResults_ClosesTheOpenQuestion()
        {
            var (host, hostId, game) = await StartedGameAsync(questionCount: 2);

            var closed = await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            Assert.Equal(1, closed);

            var saved = await LoadGameAsync(game.Id);
            Assert.Equal(GameStatus.Results, saved.Status);
            Assert.Equal(1, saved.CurrentQuestionOrder);
            Assert.NotNull(saved.CurrentQuestionStartedAtUtc);
        }

        [Fact]
        public async Task ShowResults_InTheLobby_IsRejected()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateLobbyAsync(host, questionCount: 1);

            var error = await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.ShowResultsAsync(game.Id, hostId)));

            Assert.Equal(GameMessages.QuestionNotOpen, error.Message);
        }

        [Fact]
        public async Task ShowResults_Twice_IsRejected()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 2);
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            var error = await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.ShowResultsAsync(game.Id, hostId)));

            Assert.Equal(GameMessages.QuestionNotOpen, error.Message);
        }

        [Fact]
        public async Task NextQuestion_WhileTheQuestionIsOpen_IsRejected()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 2);

            var error = await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.NextQuestionAsync(game.Id, hostId)));

            Assert.Equal(GameMessages.ResultsNotShown, error.Message);
            Assert.Equal(1, (await LoadGameAsync(game.Id)).CurrentQuestionOrder);
        }

        [Fact]
        public async Task NextQuestion_AfterTheResults_ShowsTheNextQuestion()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 2);
            var startedGame = await LoadGameAsync(game.Id);
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            var result = await Flow(f => f.NextQuestionAsync(game.Id, hostId));

            Assert.False(result.Finished);
            Assert.Equal(2, result.Question!.ForPlayers.Number);
            Assert.Equal(2, result.Question.ForPlayers.Total);

            var saved = await LoadGameAsync(game.Id);
            Assert.Equal(GameStatus.Question, saved.Status);
            Assert.Equal(2, saved.CurrentQuestionOrder);
            Assert.Equal(startedGame.StartedAtUtc, saved.StartedAtUtc);
            Assert.True(saved.CurrentQuestionStartedAtUtc >= startedGame.CurrentQuestionStartedAtUtc);
            Assert.Equal(
                TimeSpan.FromSeconds(30),
                saved.CurrentQuestionEndsAtUtc!.Value - saved.CurrentQuestionStartedAtUtc!.Value);
        }

        [Fact]
        public async Task NextQuestion_AfterTheLastOne_FinishesTheGameAndFreesTheQuiz()
        {
            var (host, hostId, game) = await StartedGameAsync(questionCount: 1);
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            var result = await Flow(f => f.NextQuestionAsync(game.Id, hostId));

            Assert.True(result.Finished);

            var saved = await LoadGameAsync(game.Id);
            Assert.Equal(GameStatus.Finished, saved.Status);
            Assert.NotNull(saved.EndedAtUtc);
            Assert.Equal(1, saved.CurrentQuestionOrder);

            // The quiz may have a new game now: one active game per quiz is the only limit.
            await host.CreateGameAsync(saved.QuizId);
        }

        [Fact]
        public async Task AGameRunsFromTheLobbyToTheEnd()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 3);

            for (var number = 1; number <= 3; number++)
            {
                Assert.Equal(number, await Flow(f => f.ShowResultsAsync(game.Id, hostId)));

                var next = await Flow(f => f.NextQuestionAsync(game.Id, hostId));

                Assert.Equal(number == 3, next.Finished);
            }

            Assert.Equal(GameStatus.Finished, (await LoadGameAsync(game.Id)).Status);
        }

        [Theory]
        [InlineData(GameStatus.Lobby)]
        [InlineData(GameStatus.Question)]
        [InlineData(GameStatus.Results)]
        public async Task End_FromAnyActiveState_KeepsTheGameFinished(GameStatus state)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateLobbyAsync(host, questionCount: 2);

            if (state != GameStatus.Lobby)
            {
                await Flow(f => f.StartAsync(game.Id, hostId));
            }

            if (state == GameStatus.Results)
            {
                await Flow(f => f.ShowResultsAsync(game.Id, hostId));
            }

            Assert.True(await Flow(f => f.EndAsync(game.Id, hostId)));

            var saved = await LoadGameAsync(game.Id);
            Assert.Equal(GameStatus.Finished, saved.Status);
            Assert.NotNull(saved.EndedAtUtc);
            Assert.Equal(state == GameStatus.Lobby ? null : 1, saved.CurrentQuestionOrder);
        }

        [Fact]
        public async Task End_Twice_IsANoOp()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 1);

            Assert.True(await Flow(f => f.EndAsync(game.Id, hostId)));
            var endedAt = (await LoadGameAsync(game.Id)).EndedAtUtc;

            Assert.False(await Flow(f => f.EndAsync(game.Id, hostId)));
            Assert.Equal(endedAt, (await LoadGameAsync(game.Id)).EndedAtUtc);
        }

        [Fact]
        public async Task EndOverRest_UsesTheSameImplementationAndKeepsTheProgress()
        {
            var (host, _, game) = await StartedGameAsync(questionCount: 2);

            var response = await host.PostAsync($"/api/games/{game.Id}/end", null, Ct);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var saved = await LoadGameAsync(game.Id);
            Assert.Equal(GameStatus.Finished, saved.Status);
            Assert.Equal(1, saved.CurrentQuestionOrder);
        }

        [Fact]
        public async Task EveryCommand_FromAnotherUser_IsNotFoundAndChangesNothing()
        {
            var (_, _, game) = await StartedGameAsync(questionCount: 2);
            var (_, strangerId) = await factory.CreateHostAsync();

            await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.ShowResultsAsync(game.Id, strangerId)));
            await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.NextQuestionAsync(game.Id, strangerId)));
            await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.EndAsync(game.Id, strangerId)));

            Assert.Equal(GameStatus.Question, (await LoadGameAsync(game.Id)).Status);
        }

        [Fact]
        public async Task EveryCommand_OnAnEndedGame_IsNotFoundExceptEnd()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 2);
            await Flow(f => f.EndAsync(game.Id, hostId));

            await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.ShowResultsAsync(game.Id, hostId)));
            await Assert.ThrowsAsync<NotFoundException>(() => Flow(f => f.NextQuestionAsync(game.Id, hostId)));
            Assert.False(await Flow(f => f.EndAsync(game.Id, hostId)));
        }

        [Fact]
        public async Task TwoNextQuestionsAtTheSameTime_AdvanceTheGameOnce()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 3);
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            var results = await Task.WhenAll(
                TryAsync(() => Flow(f => f.NextQuestionAsync(game.Id, hostId))),
                TryAsync(() => Flow(f => f.NextQuestionAsync(game.Id, hostId))));

            Assert.Single(results, error => error is null);
            Assert.Single(results, error => error is ConflictException);
            Assert.Equal(2, (await LoadGameAsync(game.Id)).CurrentQuestionOrder);
        }

        [Fact]
        public async Task TwoShowResultsAtTheSameTime_CloseTheQuestionOnce()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 2);

            var results = await Task.WhenAll(
                TryAsync(() => Flow(f => f.ShowResultsAsync(game.Id, hostId))),
                TryAsync(() => Flow(f => f.ShowResultsAsync(game.Id, hostId))));

            Assert.Single(results, error => error is null);
            Assert.Single(results, error => error is ConflictException);
        }

        [Fact]
        public async Task TwoEndsAtTheSameTime_EndTheGameOnce()
        {
            var (_, hostId, game) = await StartedGameAsync(questionCount: 1);

            var results = await Task.WhenAll(
                Flow(f => f.EndAsync(game.Id, hostId)),
                Flow(f => f.EndAsync(game.Id, hostId)));

            Assert.Single(results, ended => ended);
            Assert.Single(results, ended => !ended);
        }

        private async Task<GameDto> CreateLobbyAsync(HttpClient host, int questionCount)
        {
            var quiz = await host.CreateQuizAsync(QuizKind.OpenText);

            for (var i = 0; i < questionCount; i++)
            {
                await host.AddQuestionAsync(quiz.Id, QuizKind.OpenText);
            }

            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");
            return game;
        }

        private async Task<(HttpClient Host, string HostId, GameDto Game)> StartedGameAsync(int questionCount)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateLobbyAsync(host, questionCount);
            await Flow(f => f.StartAsync(game.Id, hostId));
            return (host, hostId, game);
        }

        private async Task<T> Flow<T>(Func<IGameFlowService, Task<T>> action)
        {
            using var scope = factory.Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<IGameFlowService>());
        }

        private static async Task<Exception?> TryAsync(Func<Task> action)
        {
            try
            {
                await action();
                return null;
            }
            catch (Exception ex)
            {
                return ex;
            }
        }

        private async Task<GameSessionRecord> LoadGameAsync(int gameId)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await db.GameSessionRecords.AsNoTracking().SingleAsync(g => g.Id == gameId, Ct);
        }
    }
}
