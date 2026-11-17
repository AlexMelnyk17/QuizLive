using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Infrastructure.Realtime;

public sealed class LiveGameWorker(IServiceScopeFactory scopes, TimeProvider clock,
    GamePresence presence, ILogger<LiveGameWorker> logger) : BackgroundService
{
    // Persistent deadlines are read on every tick: extensions, questions started through REST,
    // and questions left open across restarts all use the same closing transition.
    public async Task TickAsync(CancellationToken cancellationToken = default)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = clock.GetUtcNow().UtcDateTime;
        var expired = await db.GameSessionRecords.AsNoTracking()
            .Where(g => g.EndedAtUtc == null && g.Status == GameStatus.Question && g.CurrentQuestionEndsAtUtc <= now)
            .Select(g => new { g.Id, g.CurrentQuestionOrder, g.CurrentQuestionEndsAtUtc }).ToListAsync(cancellationToken);
        var flow = scope.ServiceProvider.GetRequiredService<GameFlowService>();
        foreach (var game in expired)
            await flow.CloseExpiredAsync(game.Id, game.CurrentQuestionOrder!.Value, game.CurrentQuestionEndsAtUtc!.Value);
        await presence.SweepAsync(db, cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(250), clock);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try { await TickAsync(stoppingToken); }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception ex) { logger.LogError(ex, "Live game timer/presence tick failed"); }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
    }
}
