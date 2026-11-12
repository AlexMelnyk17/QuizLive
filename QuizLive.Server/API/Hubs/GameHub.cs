using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.API.Hubs
{
    /// <summary>
    /// Realtime channel of a game. Players connect with their player token, the host with a JWT.
    /// Both connect methods return the current state, so nothing sent before connecting is lost.
    /// </summary>
    public class GameHub(AppDbContext db) : Hub<IGameClient>
    {
        public const string PlayerIdKey = "PlayerId";
        public const string GameIdKey = "GameId";

        public async Task<PlayerGameStateDto> ConnectAsPlayer(string playerToken)
        {
            if (string.IsNullOrWhiteSpace(playerToken))
            {
                throw new DomainValidationException("Player token is required.");
            }

            var state = await db.Players
                .AsNoTracking()
                .Where(p => p.Token == playerToken && p.GameSession.EndedAtUtc == null)
                .Select(p => new PlayerGameStateDto(
                    p.GameSessionRecordId,
                    p.GameSession.Code,
                    p.GameSession.Quiz.Title,
                    p.GameSession.Status,
                    p.Id,
                    p.Nickname,
                    p.GameSession.Players
                        .OrderBy(x => x.JoinedAtUtc)
                        .Select(x => new GamePlayerDto(x.Id, x.Nickname, x.JoinedAtUtc))
                        .ToList()))
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException("Player was not found.");

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

            var game = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Id == gameId && g.HostUserId == userId && g.EndedAtUtc == null)
                .Select(GameMappings.ToDto)
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException($"Game {gameId} was not found.");

            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));
            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Host(gameId));

            Context.Items[GameIdKey] = gameId;

            return game;
        }
    }
}
