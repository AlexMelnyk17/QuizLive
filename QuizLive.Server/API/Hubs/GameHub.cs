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
    /// The hub only manages connections and groups and passes the host's commands on; the rules live in
    /// <see cref="IGameService"/> and <see cref="IGameFlowService"/>.
    /// </summary>
    public class GameHub(IGameService gameService, IGameFlowService gameFlow) : Hub<IGameClient>
    {
        public const string PlayerIdKey = "PlayerId";
        public const string GameIdKey = "GameId";
        public const string RoleKey = "Role";

        // Both connect methods check access first, then join the group, and only then read the state.
        // The other way round, a player who joins in between would be missing from both the snapshot
        // and the event. The cost is a possible duplicate, so a client must deduplicate by player id.
        public async Task<PlayerGameStateDto> ConnectAsPlayer(string playerToken)
        {
            EnsureNotConnected();

            var gameId = await gameService.GetActivePlayerGameIdAsync(playerToken);

            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));

            PlayerGameStateDto state;

            try
            {
                state = await gameService.GetPlayerStateAsync(playerToken);

                // A player who joins in the middle of a game gets the running question, without IsCorrect.
                var current = await gameFlow.GetCurrentQuestionAsync(gameId);
                state = state with { CurrentQuestion = current?.ForPlayers };
            }
            catch
            {
                // The game ended in between: do not keep the connection in the group of a finished game.
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.All(gameId));
                throw;
            }

            Context.Items[PlayerIdKey] = state.PlayerId;
            Context.Items[GameIdKey] = state.GameId;
            Context.Items[RoleKey] = ConnectionRole.Player;

            return state;
        }

        [Authorize]
        public async Task<HostGameStateDto> ConnectAsHost(int gameId)
        {
            EnsureNotConnected();

            // Not ICurrentUser: it relies on IHttpContextAccessor, which is unreliable inside a hub.
            var userId = Context.UserIdentifier
                ?? throw new UnauthorizedException("The user is not authenticated.");

            await gameService.EnsureActiveHostGameAsync(gameId, userId);

            // The host controls the game but does not take part in it, so the connection stays out of the
            // players' group. The notifier sends every lobby event to the host group as well.
            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Host(gameId));

            HostGameStateDto state;

            try
            {
                var game = await gameService.GetActiveHostGameAsync(gameId, userId);

                // A host tab opened in the middle of a game gets the running question, like the other tabs have it.
                var current = await gameFlow.GetCurrentQuestionAsync(gameId);
                state = new HostGameStateDto(game, current?.ForHost);
            }
            catch
            {
                // The game ended in between: do not keep the connection in the group of a finished game.
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.Host(gameId));
                throw;
            }

            Context.Items[GameIdKey] = gameId;
            Context.Items[RoleKey] = ConnectionRole.Host;

            return state;
        }

        // The host's commands. A command has no game id: it always acts on the game this connection joined, so
        // the client cannot aim it at another game. The result reaches everyone as an event (QuestionShown,
        // QuestionClosed, GameEnded), including the host's other tabs, so the commands return nothing.
        [Authorize]
        public Task StartGame()
        {
            var (gameId, userId) = HostCommandContext();
            return gameFlow.StartAsync(gameId, userId);
        }

        [Authorize]
        public Task ShowResults()
        {
            var (gameId, userId) = HostCommandContext();
            return gameFlow.ShowResultsAsync(gameId, userId);
        }

        [Authorize]
        public Task NextQuestion()
        {
            var (gameId, userId) = HostCommandContext();
            return gameFlow.NextQuestionAsync(gameId, userId);
        }

        [Authorize]
        public Task EndGame()
        {
            var (gameId, userId) = HostCommandContext();
            return gameFlow.EndAsync(gameId, userId);
        }

        // Only a connection that joined as the host passes: the role is set by ConnectAsHost after its access check.
        private (int GameId, string UserId) HostCommandContext()
        {
            if (!Context.Items.TryGetValue(RoleKey, out var role) || role is not ConnectionRole.Host)
            {
                throw new UnauthorizedException(GameMessages.HostOnly);
            }

            var userId = Context.UserIdentifier ?? throw new UnauthorizedException(GameMessages.HostOnly);

            return ((int)Context.Items[GameIdKey]!, userId);
        }

        // One connection joins one game, once. A repeated call would leave it in the groups of the first
        // game and overwrite its identity. Invocations on one connection run one at a time, and a failed
        // connect sets nothing, so the client can retry after an error.
        private void EnsureNotConnected()
        {
            if (Context.Items.ContainsKey(GameIdKey))
            {
                throw new ConflictException("This connection has already joined a game.");
            }
        }
    }
}
