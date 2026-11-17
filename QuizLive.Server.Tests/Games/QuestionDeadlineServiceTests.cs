using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.Games;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class QuestionDeadlineServiceTests(QuestionTimerFactory factory) : IClassFixture<QuestionTimerFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task AnOverdueGame_IsClosedWhenTheServiceStarts()
        {
            var (_, _, game) = await StartedGameAsync();
            factory.Clock.Advance(TimeSpan.FromSeconds(30));

            var service = ActivatorUtilities.CreateInstance<QuestionDeadlineService>(factory.Services);
            await service.StartAsync(Ct);

            try
            {
                await WaitUntilAsync(async () => (await LoadGameAsync(game.Id)).Status == GameStatus.Results);
            }
            finally
            {
                await service.StopAsync(Ct);
            }

            Assert.Equal(GameStatus.Results, (await LoadGameAsync(game.Id)).Status);
            Assert.Single(
                factory.Notifier.EventsFor(game.Id),
                e => e.Name == nameof(IGameClient.QuestionClosed));
        }

        private async Task<(HttpClient Host, string HostId, GameDto Game)> StartedGameAsync()
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.OpenText);
            await host.AddQuestionAsync(quiz.Id, QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");

            using var scope = factory.Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<IGameFlowService>().StartAsync(game.Id, hostId);

            return (host, hostId, game);
        }

        private async Task<GameSessionRecord> LoadGameAsync(int gameId)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await db.GameSessionRecords.AsNoTracking().SingleAsync(g => g.Id == gameId, Ct);
        }

        private static async Task WaitUntilAsync(Func<Task<bool>> condition)
        {
            for (var i = 0; i < 50; i++)
            {
                if (await condition())
                {
                    return;
                }

                await Task.Delay(20, Ct);
            }

            Assert.Fail("The overdue question was not closed when the service started.");
        }
    }
}
