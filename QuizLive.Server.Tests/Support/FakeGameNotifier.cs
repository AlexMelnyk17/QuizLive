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

        public Task QuestionShownAsync(int gameId, QuestionViews views)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.QuestionShown), gameId, Views: views));
            return Task.CompletedTask;
        }

        public Task QuestionClosedAsync(int gameId, int number)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.QuestionClosed), gameId, Number: number));
            return Task.CompletedTask;
        }

        public Task QuestionTimeExtendedAsync(int gameId, QuestionTimingDto timing)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.QuestionTimeExtended), gameId, Timing: timing));
            return Task.CompletedTask;
        }

        public Task GameEndedAsync(int gameId)
        {
            _events.Enqueue(new GameEvent(nameof(IGameClient.GameEnded), gameId));
            return Task.CompletedTask;
        }
    }

    public record GameEvent(
        string Name,
        int GameId,
        GamePlayerDto? Player = null,
        QuestionViews? Views = null,
        int? Number = null,
        QuestionTimingDto? Timing = null);
}
