using QuizLive.Server.Application.Stats;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IStatsService
    {
        Task<HostStatsDto> GetMyStatsAsync();

        Task<QuizPlayStatsDto> GetQuizStatsAsync(int quizId);

        Task<GamePlayStatsDto> GetGameStatsAsync(int gameId);
    }
}