using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Stats
{
    public class GameStatsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task GetGameStats_WithoutToken_Returns401()
        {
            var response = await factory.CreateClient().GetAsync("/api/stats/games/1", Ct);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetGameStats_ForMissingGame_Returns404()
        {
            var host = await factory.CreateAuthorizedClientAsync();

            var response = await host.GetAsync("/api/stats/games/99999", Ct);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetGameStats_ForActiveGame_Returns409()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            var game = await host.CreateGameAsync(quiz.Id);

            var response = await host.GetAsync($"/api/stats/games/{game.Id}", Ct);

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }

        [Fact]
        public async Task GetGameStats_ForFinishedQuizChoice_IncludesScoresAndOptionCounts()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.QuizChoice);
            var question = await host.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);
            var game = await host.CreateGameAsync(quiz.Id);
            var winner = await factory.CreateClient().JoinAsync(game.Code, "Ace");
            var other = await factory.CreateClient().JoinAsync(game.Code, "Miss");
            await EndGameAsync(host, game.Id);

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var options = await db.QuizOptions
                    .Where(o => o.QuizQuestionId == question.Id)
                    .OrderBy(o => o.Order)
                    .ToListAsync(Ct);
                var correct = options.Single(o => o.IsCorrect);
                var wrong = options.Single(o => !o.IsCorrect);

                await SeedAsync(db =>
                {
                    db.QuizAnswers.AddRange(
                        new QuizAnswer
                        {
                            QuizQuestionId = question.Id,
                            PlayerId = winner.PlayerId,
                            QuizOptionId = correct.Id,
                            IsCorrect = true,
                            Points = 100,
                        },
                        new QuizAnswer
                        {
                            QuizQuestionId = question.Id,
                            PlayerId = other.PlayerId,
                            QuizOptionId = wrong.Id,
                            IsCorrect = false,
                            Points = 0,
                        });
                });
            }

            var stats = await GetGameStatsAsync(host, game.Id);

            Assert.Equal(2, stats.PlayerCount);
            var q = Assert.Single(stats.QuizChoiceQuestions!);
            Assert.Equal(50m, q.CorrectPercent);
            Assert.Equal(1, q.Options.Single(o => o.IsCorrect).Count);
            Assert.Equal(1, q.Options.Single(o => !o.IsCorrect).Count);

            var ace = stats.Players.Single(p => p.Nickname == "Ace");
            Assert.Equal(1, ace.CorrectCount);
            Assert.Equal(100, ace.TotalPoints);
        }

        private static async Task<GamePlayStatsDto> GetGameStatsAsync(HttpClient host, int gameId)
        {
            var response = await host.GetAsync($"/api/stats/games/{gameId}", Ct);
            return await response.ReadAsync<GamePlayStatsDto>(HttpStatusCode.OK);
        }

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        private Task SeedAsync(Action<AppDbContext> change) => SeedAsync(db =>
        {
            change(db);
            return Task.CompletedTask;
        });

        private async Task SeedAsync(Func<AppDbContext, Task> change)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await change(db);
            await db.SaveChangesAsync(Ct);
        }
    }
}