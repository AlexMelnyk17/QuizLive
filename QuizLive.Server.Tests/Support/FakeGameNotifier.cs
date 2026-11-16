using System.Collections.Concurrent;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Tests.Support
{
    public class FakeGameNotifier : IGameNotifier
    {
        private readonly ConcurrentQueue<GameEvent> _events = new();

        public IReadOnlyList<GameEvent> EventsFor(int gameId) =>
            _events.Where(e => e.GameId == gameId).ToList();

        public Task PlayerJoinedAsync(int gameId, GamePlayerDto player)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.PlayerJoined), gameId, player));
            return Task.CompletedTask;
        }

        public Task GameEndedAsync(int gameId)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.GameEnded), gameId));
            return Task.CompletedTask;
        }
    }

    public record GameEvent(string Name, int GameId, GamePlayerDto? Player = null);
}
