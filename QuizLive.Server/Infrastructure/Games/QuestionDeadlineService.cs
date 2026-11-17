using QuizLive.Server.Application.Abstractions;

namespace QuizLive.Server.Infrastructure.Games
{
    // Closes questions whose time has already ended. The first pass runs as soon as the process starts,
    // so a game that expired while the server was down is still closed. Later passes are about once a
    // second. A failed pass is logged and the next one still runs.
    public class QuestionDeadlineService(
        IServiceScopeFactory scopes,
        TimeProvider clock,
        ILogger<QuestionDeadlineService> logger) : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(1);

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await CloseDueQuestionsAsync(stoppingToken);

                using var timer = new PeriodicTimer(CheckInterval, clock);

                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await CloseDueQuestionsAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
            }
        }

        private async Task CloseDueQuestionsAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var flow = scope.ServiceProvider.GetRequiredService<IGameFlowService>();
                await flow.CloseExpiredQuestionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to close questions that have run out of time.");
            }
        }
    }
}
