using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class QuestionTimerTests(QuestionTimerFactory factory) : IClassFixture<QuestionTimerFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task AnExpiredQuestion_IsClosedOnce()
        {
            var (_, _, game) = await StartedGameAsync();

            factory.Clock.Advance(TimeSpan.FromSeconds(30));
            await Flow(f => f.CloseExpiredQuestionsAsync(Ct));
            await Flow(f => f.CloseExpiredQuestionsAsync(Ct));

            Assert.Equal(GameStatus.Results, (await LoadGameAsync(game.Id)).Status);
            Assert.Single(EventsOf(game.Id, nameof(IGameClient.QuestionClosed)));
        }

        [Fact]
        public async Task AQuestionWithoutATimeLimit_IsNotClosedByTheTimer()
        {
            var (_, _, game) = await StartedGameAsync(timeLimitSeconds: null);

            factory.Clock.Advance(TimeSpan.FromHours(1));
            await Flow(f => f.CloseExpiredQuestionsAsync(Ct));

            Assert.Equal(GameStatus.Question, (await LoadGameAsync(game.Id)).Status);
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionClosed)));
        }

        [Fact]
        public async Task ShowResultsAndTheTimerAtTheSameMoment_CloseTheQuestionOnce()
        {
            var (_, hostId, game) = await StartedGameAsync();
            factory.Clock.Advance(TimeSpan.FromSeconds(30));

            var results = await Task.WhenAll(
                TryAsync(() => Flow(f => f.ShowResultsAsync(game.Id, hostId))),
                TryAsync(() => Flow(f => f.CloseExpiredQuestionsAsync(Ct))));

            Assert.DoesNotContain(results, error => error is not null and not ConflictException);
            Assert.Equal(GameStatus.Results, (await LoadGameAsync(game.Id)).Status);
            Assert.Single(EventsOf(game.Id, nameof(IGameClient.QuestionClosed)));
        }

        [Fact]
        public async Task AddTime_ExtendsTheOpenQuestion_AndSendsTheNewTiming()
        {
            var (_, hostId, game) = await StartedGameAsync();
            var started = await LoadGameAsync(game.Id);
            var endsAt = started.CurrentQuestionEndsAtUtc!.Value;

            await Flow(f => f.AddTimeAsync(game.Id, hostId, 15));

            var updated = await LoadGameAsync(game.Id);
            Assert.Equal(endsAt.AddSeconds(15), updated.CurrentQuestionEndsAtUtc);

            var extended = Assert.Single(EventsOf(game.Id, nameof(IGameClient.QuestionTimeExtended)));
            Assert.Equal(started.CurrentQuestionStartedAtUtc, extended.Timing!.StartedAtUtc);
            Assert.Equal(updated.CurrentQuestionEndsAtUtc, extended.Timing.EndsAtUtc);
            Assert.Equal(factory.Clock.GetUtcNow().UtcDateTime, extended.Timing.ServerNowUtc);
        }

        [Fact]
        public async Task AddTime_OfAClosedQuestion_IsRejected()
        {
            var (_, hostId, game) = await StartedGameAsync();
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));
            var endsAt = (await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc;

            var error = await Assert.ThrowsAsync<ConflictException>(
                () => Flow(f => f.AddTimeAsync(game.Id, hostId, 15)));

            Assert.Equal(GameMessages.NoTimedQuestion, error.Message);
            Assert.Equal(endsAt, (await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc);
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionTimeExtended)));
        }

        [Fact]
        public async Task AddTime_OfAQuestionWithoutALimit_IsRejected()
        {
            var (_, hostId, game) = await StartedGameAsync(timeLimitSeconds: null);

            var error = await Assert.ThrowsAsync<ConflictException>(
                () => Flow(f => f.AddTimeAsync(game.Id, hostId, 15)));

            Assert.Equal(GameMessages.NoTimedQuestion, error.Message);
            Assert.Null((await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc);
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionTimeExtended)));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(GameTiming.MaxAddedSeconds + 1)]
        public async Task AddTime_WithAWrongAmount_IsRejected(int seconds)
        {
            var (_, hostId, game) = await StartedGameAsync();
            var endsAt = (await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc;

            var error = await Assert.ThrowsAsync<DomainValidationException>(
                () => Flow(f => f.AddTimeAsync(game.Id, hostId, seconds)));

            Assert.Equal(GameMessages.InvalidAddedTime, error.Message);
            Assert.Equal(endsAt, (await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc);
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionTimeExtended)));
        }

        private IReadOnlyList<GameEvent> EventsOf(int gameId, string name) =>
            factory.Notifier.EventsFor(gameId).Where(e => e.Name == name).ToList();

        private async Task<(HttpClient Host, string HostId, GameDto Game)> StartedGameAsync(
            int? timeLimitSeconds = 30)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.OpenText);
            var created = await host.PostAsJsonAsync(
                $"/api/quizzes/{quiz.Id}/questions",
                new QuestionRequest("Timed?", timeLimitSeconds, null, null, null),
                Ct);
            await created.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");
            await Flow(f => f.StartAsync(game.Id, hostId));
            return (host, hostId, game);
        }

        private async Task<T> Flow<T>(Func<IGameFlowService, Task<T>> action)
        {
            using var scope = factory.Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<IGameFlowService>());
        }

        private Task Flow(Func<IGameFlowService, Task> action) =>
            Flow(async f =>
            {
                await action(f);
                return 0;
            });

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
