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
            SendAsync(gameId, nameof(IGameClient.PlayerJoined), clients => Everyone(clients, gameId).PlayerJoined(player));

        // Two payloads for two audiences: the players' group never gets the host version.
        public Task QuestionShownAsync(int gameId, QuestionViews views) =>
            SendAsync(gameId, nameof(IGameClient.QuestionShown), async clients =>
            {
                await clients.Group(GameGroups.All(gameId)).QuestionShown(views.ForPlayers);
                await clients.Group(GameGroups.Host(gameId)).HostQuestionShown(views.ForHost);
            });

        public Task QuestionClosedAsync(int gameId, int number) =>
            SendAsync(gameId, nameof(IGameClient.QuestionClosed), clients => Everyone(clients, gameId).QuestionClosed(number));

        public Task GameEndedAsync(int gameId) =>
            SendAsync(gameId, nameof(IGameClient.GameEnded), clients => Everyone(clients, gameId).GameEnded());

        // The host is not in the players' group, so these events go to both groups; a connection is in one of them only.
        private static IGameClient Everyone(IHubClients<IGameClient> clients, int gameId) =>
            clients.Groups(GameGroups.All(gameId), GameGroups.Host(gameId));

        // The change is already saved, so a failed broadcast must not fail the request.
        private async Task SendAsync(int gameId, string eventName, Func<IHubClients<IGameClient>, Task> send)
        {
            try
            {
                await send(hub.Clients);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send {Event} for game {GameId}", eventName, gameId);
            }
        }
    }
}
