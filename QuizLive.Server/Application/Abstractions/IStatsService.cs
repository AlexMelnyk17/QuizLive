using QuizLive.Server.Application.Stats;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IStatsService
    {
        Task<HostStatsDto> GetMyStatsAsync();
    }
}