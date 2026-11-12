using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IGameService
    {
        Task<GameDto> CreateAsync(CreateGameRequest request);
        Task<GameDto> GetByIdAsync(int id);
        Task EndAsync(int id);
        Task<GameLookupDto> GetByCodeAsync(string code);
        Task<JoinGameResponse> JoinAsync(string code, JoinGameRequest request);
    }
}
