using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Infrastructure.Realtime;

// Presence belongs to connections, not tokens. Several host/player tabs count as one online person.
// This registry matches the application's single-server SQLite deployment.
public sealed class GamePresence(TimeProvider clock, IGameNotifier notifier)
{
    private sealed class Presence
    {
        public HashSet<string> Hosts { get; } = [];
        public Dictionary<int, HashSet<string>> Players { get; } = [];
        public DateTime? HostMissingSince { get; set; }
    }

    private readonly SemaphoreSlim gate = new(1);
    private readonly Dictionary<int, Presence> games = [];

    public async Task HostConnectedAsync(int gameId, string connectionId, Func<Task> authorize)
    {
        await gate.WaitAsync();
        try
        {
            // Cleanup uses the same gate; a reconnect either cancels deletion or sees NotFound.
            await authorize();
            var game = Get(gameId);
            game.Hosts.Add(connectionId);
            game.HostMissingSince = null;
        }
        finally { gate.Release(); }
    }

    public async Task PlayerConnectedAsync(int gameId, int playerId, string connectionId)
    {
        await gate.WaitAsync();
        try
        {
            var game = Get(gameId);
            if (!game.Players.TryGetValue(playerId, out var connections))
                game.Players[playerId] = connections = [];
            if (connections.Add(connectionId) && connections.Count == 1)
                await notifier.PlayerPresenceChangedAsync(gameId, new(playerId, true));
        }
        finally { gate.Release(); }
    }

    public async Task DisconnectedAsync(int gameId, int? playerId, string connectionId)
    {
        await gate.WaitAsync();
        try
        {
            if (!games.TryGetValue(gameId, out var game)) return;
            if (playerId is null)
            {
                if (game.Hosts.Remove(connectionId) && game.Hosts.Count == 0)
                    game.HostMissingSince = clock.GetUtcNow().UtcDateTime;
            }
            else if (game.Players.TryGetValue(playerId.Value, out var connections) &&
                connections.Remove(connectionId) && connections.Count == 0)
            {
                game.Players.Remove(playerId.Value);
                await notifier.PlayerPresenceChangedAsync(gameId, new(playerId.Value, false));
                await notifier.PlayerLeftAsync(gameId, playerId.Value);
            }
        }
        finally { gate.Release(); }
    }

    public async Task<List<PlayerPresenceDto>> SnapshotAsync(int gameId, IEnumerable<int> playerIds)
    {
        await gate.WaitAsync();
        try
        {
            games.TryGetValue(gameId, out var game);
            return playerIds.Select(id => new PlayerPresenceDto(id, game?.Players.ContainsKey(id) == true)).ToList();
        }
        finally { gate.Release(); }
    }

    public async Task SweepAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        await gate.WaitAsync(cancellationToken);
        try
        {
            var active = await db.GameSessionRecords.Where(g => g.EndedAtUtc == null)
                .Select(g => g.Id).ToListAsync(cancellationToken);
            var now = clock.GetUtcNow().UtcDateTime;
            foreach (var gameId in active)
            {
                var game = Get(gameId);
                if (game.Hosts.Count != 0) continue;
                game.HostMissingSince ??= now; // Also recovers orphan games after a server restart.
                if (now - game.HostMissingSince.Value < TimeSpan.FromSeconds(20)) continue;
                var deleted = await db.GameSessionRecords.Where(g => g.Id == gameId && g.EndedAtUtc == null)
                    .ExecuteDeleteAsync(cancellationToken);
                if (deleted != 0) await notifier.GameEndedAsync(gameId);
                games.Remove(gameId);
            }
            foreach (var id in games.Keys.Except(active).ToList()) games.Remove(id);
        }
        finally { gate.Release(); }
    }

    private Presence Get(int gameId)
    {
        if (!games.TryGetValue(gameId, out var game)) games[gameId] = game = new();
        return game;
    }
}
