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

        // Hub entry points: a hub cannot rely on ICurrentUser, so the caller passes the identity explicitly.
        // hostUserId must come from the authenticated connection (Context.UserIdentifier), never from a client argument.
        Task<GameDto> GetActiveHostGameAsync(int gameId, string hostUserId);
        Task<PlayerGameStateDto> GetPlayerStateAsync(string playerToken);
    }
}
