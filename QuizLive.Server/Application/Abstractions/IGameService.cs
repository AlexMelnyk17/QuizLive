using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IGameService
    {
        Task<GameDto> CreateAsync(CreateGameRequest request);
        Task<List<GameSummaryDto>> GetMyGamesAsync(int? quizId = null, GameStatus? status = null);
        Task<GameDto> GetByIdAsync(int id);
        Task EndAsync(int id);
        Task<GameLookupDto> GetByCodeAsync(string code);
        Task<JoinGameResponse> JoinAsync(string code, JoinGameRequest request);

        // Hub entry points: a hub cannot rely on ICurrentUser, so the caller passes the identity explicitly.
        // hostUserId must come from the authenticated connection (Context.UserIdentifier), never from a client argument.
        Task<GameDto> GetActiveHostGameAsync(int gameId, string hostUserId);
        Task<PlayerGameStateDto> GetPlayerStateAsync(string playerToken);

        // Light access checks: a connection may join a game's SignalR group only after one of them passes,
        // and the full state is read afterwards, so an event sent in between is not lost.
        Task EnsureActiveHostGameAsync(int gameId, string hostUserId);
        Task<int> GetActivePlayerGameIdAsync(string playerToken);
    }
}
