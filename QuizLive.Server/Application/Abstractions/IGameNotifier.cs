using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IGameNotifier
    {
        Task PlayerJoinedAsync(int gameId, GamePlayerDto player);
        Task GameEndedAsync(int gameId);
    }
}
