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

        public Task AnswerProgressAsync(int gameId, AnswerProgressDto progress)
        {
            _events.Enqueue(new GameEvent("AnswerProgress", gameId, Payload: progress));
            return Task.CompletedTask;
        }

        public Task HostResultsAsync(int gameId, HostQuestionResultsDto results)
        {
            _events.Enqueue(new GameEvent("HostResults", gameId, Payload: results));
            return Task.CompletedTask;
        }

        public Task PlayerResultsAsync(int gameId, int playerId, PlayerQuestionResultsDto results)
        {
            _events.Enqueue(new GameEvent("PlayerResults", gameId, Payload: results));
            return Task.CompletedTask;
        }

        public Task LeaderboardAsync(int gameId, LeaderboardDto leaderboard)
        {
            _events.Enqueue(new GameEvent("Leaderboard", gameId, Payload: leaderboard));
            return Task.CompletedTask;
        }

        public Task TimeAddedAsync(int gameId, QuestionTimeAddedDto timing)
        {
            _events.Enqueue(new GameEvent("TimeAdded", gameId, Payload: timing));
            return Task.CompletedTask;
        }

        public Task PlayerPresenceChangedAsync(int gameId, PlayerPresenceDto presence)
        {
            _events.Enqueue(new GameEvent("PlayerPresenceChanged", gameId, Payload: presence));
            return Task.CompletedTask;
        }

        public Task PlayerLeftAsync(int gameId, int playerId)
        {
            _events.Enqueue(new GameEvent("PlayerLeft", gameId, Payload: playerId));
            return Task.CompletedTask;
        }

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
        object? Payload = null);
}
