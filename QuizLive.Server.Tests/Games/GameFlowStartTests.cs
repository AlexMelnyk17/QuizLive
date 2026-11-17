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
    // These tests call the service directly, as the hub will: every call gets its own scope and DbContext.
    public class GameFlowStartTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Theory]
        [InlineData(QuizKind.OpenText)]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task Start_MovesTheLobbyToTheFirstQuestion(QuizKind kind)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreatePlayableQuizAsync(kind);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");

            var views = await StartAsync(game.Id, hostId);

            Assert.Equal(1, views.ForPlayers.Number);
            Assert.Equal(1, views.ForPlayers.Total);
            Assert.Equal(views.ForPlayers.Text, views.ForHost.Question.Text);
            Assert.Equal(1, views.ForHost.Number);

            var saved = await LoadGameAsync(game.Id);

            Assert.Equal(GameStatus.Question, saved.Status);
            Assert.Equal(1, saved.CurrentQuestionOrder);
            Assert.NotNull(saved.StartedAtUtc);
            Assert.Equal(saved.StartedAtUtc, saved.CurrentQuestionStartedAtUtc);
            Assert.Equal(
                TimeSpan.FromSeconds(30),
                saved.CurrentQuestionEndsAtUtc!.Value - saved.CurrentQuestionStartedAtUtc!.Value);
            Assert.Equal(saved.CurrentQuestionEndsAtUtc, views.ForPlayers.Timing.EndsAtUtc);
        }

        [Theory]
        [InlineData(QuizKind.OpenText, 0)]
        [InlineData(QuizKind.PollChoice, 2)]
        [InlineData(QuizKind.QuizChoice, 2)]
        public async Task Start_GivesPlayersTheOptionsWithoutTheCorrectOne(QuizKind kind, int optionCount)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreatePlayableQuizAsync(kind);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");

            var views = await StartAsync(game.Id, hostId);

            Assert.Equal(optionCount, views.ForPlayers.Options?.Count ?? 0);
            Assert.Equal(optionCount, views.ForHost.Question.Options?.Count ?? 0);

            // The player view has no IsCorrect at all; the host view has it for a quiz and only for a quiz.
            var hostCorrect = views.ForHost.Question.Options?.Count(o => o.IsCorrect == true) ?? 0;
            Assert.Equal(kind == QuizKind.QuizChoice ? 1 : 0, hostCorrect);
        }

        [Fact]
        public async Task Start_WithoutATimeLimit_LeavesTheEndTimeEmpty()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.OpenText);
            var created = await host.PostAsJsonAsync(
                $"/api/quizzes/{quiz.Id}/questions",
                new QuestionRequest("No limit", null, null, null, null),
                Ct);
            await created.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");

            var views = await StartAsync(game.Id, hostId);

            Assert.Null(views.ForPlayers.Timing.EndsAtUtc);
            Assert.Null(views.ForPlayers.TimeLimitSeconds);
            Assert.Null((await LoadGameAsync(game.Id)).CurrentQuestionEndsAtUtc);
        }

        [Fact]
        public async Task Start_OfAGameThatAlreadyStarted_IsRejected()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateGameWithPlayerAsync(host);
            await StartAsync(game.Id, hostId);

            var error = await Assert.ThrowsAsync<ConflictException>(() => StartAsync(game.Id, hostId));

            Assert.Equal(GameMessages.AlreadyStarted, error.Message);
        }

        [Fact]
        public async Task Start_WithoutPlayers_IsRejected()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);

            var error = await Assert.ThrowsAsync<ConflictException>(() => StartAsync(game.Id, hostId));

            Assert.Equal(GameMessages.NoPlayers, error.Message);
            Assert.Equal(GameStatus.Lobby, (await LoadGameAsync(game.Id)).Status);
        }

        [Fact]
        public async Task Start_ByAnotherUser_IsNotFound()
        {
            var (host, _) = await factory.CreateHostAsync();
            var (_, strangerId) = await factory.CreateHostAsync();
            var game = await CreateGameWithPlayerAsync(host);

            await Assert.ThrowsAsync<NotFoundException>(() => StartAsync(game.Id, strangerId));

            Assert.Equal(GameStatus.Lobby, (await LoadGameAsync(game.Id)).Status);
        }

        [Fact]
        public async Task Start_OfAMissingGame_IsNotFound()
        {
            var (_, hostId) = await factory.CreateHostAsync();

            await Assert.ThrowsAsync<NotFoundException>(() => StartAsync(int.MaxValue, hostId));
        }

        [Fact]
        public async Task Start_OfAnEndedGame_IsNotFound()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateGameWithPlayerAsync(host);
            var ended = await host.PostAsync($"/api/games/{game.Id}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, ended.StatusCode);

            await Assert.ThrowsAsync<NotFoundException>(() => StartAsync(game.Id, hostId));
        }

        [Fact]
        public async Task TwoStartsAtTheSameTime_StartTheGameOnce()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var game = await CreateGameWithPlayerAsync(host);

            var results = await Task.WhenAll(TryStartAsync(game.Id, hostId), TryStartAsync(game.Id, hostId));

            Assert.Single(results, error => error is null);
            Assert.Single(results, error => error is ConflictException);
        }

        private static async Task<GameDto> CreateGameWithPlayerAsync(HttpClient host)
        {
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");
            return game;
        }

        private async Task<QuestionViews> StartAsync(int gameId, string hostId)
        {
            using var scope = factory.Services.CreateScope();
            return await scope.ServiceProvider.GetRequiredService<IGameFlowService>().StartAsync(gameId, hostId);
        }

        private async Task<Exception?> TryStartAsync(int gameId, string hostId)
        {
            try
            {
                await StartAsync(gameId, hostId);
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
