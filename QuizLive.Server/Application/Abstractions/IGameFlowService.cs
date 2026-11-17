using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    // The live part of a game. Like the hub entry points of IGameService, it takes the host's user id
    // explicitly: hostUserId must come from the authenticated connection, never from a client argument.
    // A game that is not the host's, does not exist or has ended is a NotFoundException; a command that does
    // not fit the current state is a ConflictException and changes nothing.
    public interface IGameFlowService
    {
        // Lobby to the first question.
        Task<QuestionViews> StartAsync(int gameId, string hostUserId);

        // Question to Results. Returns the number of the question that was closed.
        Task<int> ShowResultsAsync(int gameId, string hostUserId);

        // Results to the next question, or to Finished after the last one.
        Task<NextQuestionResult> NextQuestionAsync(int gameId, string hostUserId);

        // Any active state to Finished; the results collected so far are kept. Ending a game that has already
        // ended is a no-op. Returns whether this call ended the game.
        Task<bool> EndAsync(int gameId, string hostUserId);
    }
}
