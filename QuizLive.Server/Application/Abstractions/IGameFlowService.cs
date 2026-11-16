using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    // The live part of a game. Like the hub entry points of IGameService, it takes the host's user id
    // explicitly: hostUserId must come from the authenticated connection, never from a client argument.
    public interface IGameFlowService
    {
        // Lobby to the first question.
        Task<QuestionViews> StartAsync(int gameId, string hostUserId);
    }
}
