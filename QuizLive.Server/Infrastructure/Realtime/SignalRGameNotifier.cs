using Microsoft.AspNetCore.SignalR;
using QuizLive.Server.API.Hubs;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Infrastructure.Realtime
{
    public class SignalRGameNotifier(
        IHubContext<GameHub, IGameClient> hub,
        ILogger<SignalRGameNotifier> logger) : IGameNotifier
    {
        public Task PlayerJoinedAsync(int gameId, GamePlayerDto player) =>
            SendAsync(gameId, nameof(IGameClient.PlayerJoined), group => group.PlayerJoined(player));

        public Task GameEndedAsync(int gameId) =>
            SendAsync(gameId, nameof(IGameClient.GameEnded), group => group.GameEnded());

        // The change is already saved, so a failed broadcast must not fail the request.
        // The host is not in the players' group, so lobby events go to both groups; a connection is in one of them only.
        private async Task SendAsync(int gameId, string eventName, Func<IGameClient, Task> send)
        {
            try
            {
                await send(hub.Clients.Groups(GameGroups.All(gameId), GameGroups.Host(gameId)));
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send {Event} for game {GameId}", eventName, gameId);
            }
        }
    }
}
