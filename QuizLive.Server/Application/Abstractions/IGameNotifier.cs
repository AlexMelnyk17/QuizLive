using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IGameNotifier
    {
        Task PlayerJoinedAsync(int gameId, GamePlayerDto player);

        // The players get the question without IsCorrect, the host gets the author version.
        Task QuestionShownAsync(int gameId, QuestionViews views);
        Task QuestionClosedAsync(int gameId, int number);
        Task QuestionTimeExtendedAsync(int gameId, QuestionTimingDto timing);
        Task GameEndedAsync(int gameId);
    }
}
