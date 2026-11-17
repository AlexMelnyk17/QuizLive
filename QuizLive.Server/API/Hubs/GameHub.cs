using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.Realtime;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.API.Hubs
{
    /// <summary>
    /// Realtime channel of a game. Players connect with their player token, the host with a JWT.
    /// Both connect methods return the current state, so nothing sent before connecting is lost.
    /// The hub only manages connections and groups and passes the host's commands on; the rules live in
    /// <see cref="IGameService"/> and <see cref="IGameFlowService"/>.
    /// </summary>
    public class GameHub(IGameService gameService, IGameFlowService gameFlow, LiveGameService live, AppDbContext db, GamePresence presence) : Hub<IGameClient>
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
            int? connectedPlayerId = null;

            try
            {
                // Validate before taking the writer lock, then read one consistent snapshot of
                // status, question, answer and results. Closing cannot interleave those reads.
                await gameService.GetPlayerStateAsync(playerToken);
                await using var transaction = await db.Database.BeginTransactionAsync();
                state = await gameService.GetPlayerStateAsync(playerToken);
                connectedPlayerId = state.PlayerId;
                await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Player(gameId, state.PlayerId));

                // A player who joins in the middle of a game gets the running question, without IsCorrect.
                var current = await gameFlow.GetCurrentQuestionAsync(gameId);
                var leaderboard = state.Status == GameStatus.Results ? await live.LeaderboardAsync(gameId) : null;
                state = state with {
                    CurrentQuestion = current?.ForPlayers,
                    HasAnswered = await live.HasAnsweredAsync(gameId, state.PlayerId, current?.ForPlayers.Number),
                    CurrentAnswer = await live.CurrentAnswerAsync(gameId, state.PlayerId, current?.ForPlayers.Number),
                    Leaderboard = leaderboard,
                    Results = leaderboard is null ? null : await live.PlayerResultsAsync(gameId, state.PlayerId, current!.ForPlayers.Number, leaderboard)
                };
                await transaction.CommitAsync();
                await presence.PlayerConnectedAsync(gameId, state.PlayerId, Context.ConnectionId);
                state = state with { Presence = await presence.SnapshotAsync(gameId, state.Players.Select(p => p.Id)) };
            }
            catch
            {
                // The game ended in between: do not keep the connection in the group of a finished game.
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.All(gameId));
                if (connectedPlayerId is { } id)
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.Player(gameId, id));
                    await presence.DisconnectedAsync(gameId, id, Context.ConnectionId);
                }
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
                await gameService.GetActiveHostGameAsync(gameId, userId);
                await using var transaction = await db.Database.BeginTransactionAsync();
                var game = await gameService.GetActiveHostGameAsync(gameId, userId);

                // A host tab opened in the middle of a game gets the running question, like the other tabs have it.
                var current = await gameFlow.GetCurrentQuestionAsync(gameId);
                var results = game.Status == GameStatus.Results ? await live.HostResultsAsync(gameId, current!.ForHost.Number) : null;
                state = new HostGameStateDto(game, current?.ForHost, results,
                    results is null ? null : await live.LeaderboardAsync(gameId),
                    current is null ? null : await live.ProgressAsync(gameId, current.ForHost.Number));
                await transaction.CommitAsync();
                await presence.HostConnectedAsync(gameId, Context.ConnectionId,
                    () => gameService.EnsureActiveHostGameAsync(gameId, userId));
                state = state with { Presence = await presence.SnapshotAsync(gameId, game.Players.Select(p => p.Id)) };
            }
            catch
            {
                // The game ended in between: do not keep the connection in the group of a finished game.
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.Host(gameId));
                await presence.DisconnectedAsync(gameId, null, Context.ConnectionId);
                throw;
            }

            Context.Items[GameIdKey] = gameId;
            Context.Items[RoleKey] = ConnectionRole.Host;

            return state;
        }

        public Task SubmitAnswer(SubmitAnswerRequest request)
        {
            if (!Context.Items.TryGetValue(RoleKey, out var role) || role is not ConnectionRole.Player)
                throw new UnauthorizedException("Only player connections can submit answers.");
            return live.SubmitAsync((int)Context.Items[GameIdKey]!, (int)Context.Items[PlayerIdKey]!, request);
        }

        [Authorize]
        public Task AddTime(int seconds)
        {
            var (gameId, userId) = HostCommandContext();
            return gameFlow.AddTimeAsync(gameId, userId, seconds);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.Items.TryGetValue(GameIdKey, out var gameId))
                await presence.DisconnectedAsync((int)gameId!,
                    Context.Items.TryGetValue(PlayerIdKey, out var playerId) ? (int)playerId! : null,
                    Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
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
