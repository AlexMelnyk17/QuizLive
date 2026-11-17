using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    // The live part of a game. Like the hub entry points of IGameService, it takes the host's user id
    // explicitly: hostUserId must come from the authenticated connection, never from a client argument.
    // A game that is not the host's, does not exist or has ended is a NotFoundException; a command that does
    // not fit the current state is a ConflictException and changes nothing.
    public interface IGameFlowService
    {
        // The question that is open or whose results are shown, for a connection that joins in the middle of a
        // game; null in the lobby. It does not check who asks: call it only after an access check.
        Task<QuestionViews?> GetCurrentQuestionAsync(int gameId);

        // Lobby to the first question.
        Task<QuestionViews> StartAsync(int gameId, string hostUserId);

        // Question to Results. Returns the number of the question that was closed.
        Task<int> ShowResultsAsync(int gameId, string hostUserId);

        // The same Question to Results transition for every open question whose time has already ended.
        // A game that another closer already moved is skipped, so QuestionClosed is sent once.
        Task CloseExpiredQuestionsAsync(CancellationToken cancellationToken = default);

        // Moves the end of the open timed question later. A question without a limit, or one that is not
        // open, is a ConflictException; an amount outside 1..GameTiming.MaxAddedSeconds is a
        // DomainValidationException.
        Task AddTimeAsync(int gameId, string hostUserId, int seconds);

        // Results to the next question, or to Finished after the last one.
        Task<NextQuestionResult> NextQuestionAsync(int gameId, string hostUserId);

        // Any active state to Finished; the results collected so far are kept. Ending a game that has already
        // ended is a no-op. Returns whether this call ended the game.
        Task<bool> EndAsync(int gameId, string hostUserId);
    }
}
