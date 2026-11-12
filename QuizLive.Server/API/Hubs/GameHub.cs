using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;

namespace QuizLive.Server.API.Hubs
{
    /// <summary>
    /// Realtime channel of a game. Players connect with their player token, the host with a JWT.
    /// Both connect methods return the current state, so nothing sent before connecting is lost.
    /// The hub only manages connections and groups; the rules live in <see cref="IGameService"/>.
    /// </summary>
    public class GameHub(IGameService gameService) : Hub<IGameClient>
    {
        public const string PlayerIdKey = "PlayerId";
        public const string GameIdKey = "GameId";

        public async Task<PlayerGameStateDto> ConnectAsPlayer(string playerToken)
        {
            var state = await gameService.GetPlayerStateAsync(playerToken);

            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(state.GameId));

            Context.Items[PlayerIdKey] = state.PlayerId;
            Context.Items[GameIdKey] = state.GameId;

            return state;
        }

        [Authorize]
        public async Task<GameDto> ConnectAsHost(int gameId)
        {
            // Not ICurrentUser: it relies on IHttpContextAccessor, which is unreliable inside a hub.
            var userId = Context.UserIdentifier
                ?? throw new UnauthorizedException("The user is not authenticated.");

            var game = await gameService.GetActiveHostGameAsync(gameId, userId);

            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));
            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Host(gameId));

            Context.Items[GameIdKey] = gameId;

            return game;
        }
    }
}
