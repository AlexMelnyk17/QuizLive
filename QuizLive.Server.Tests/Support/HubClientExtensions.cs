using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Infrastructure.Realtime;

namespace QuizLive.Server.Tests.Support
{
    public static class HubClientExtensions
    {
        // Connects to the in-memory test server. Only WebSockets are used: they send the token in the
        // query string (?access_token=), which is exactly the path the hub authentication has to handle.
        public static HubConnection CreateHubConnection(this QuizLiveFactory factory, string? accessToken = null)
        {
            var server = factory.Server;
            var url = new Uri(server.BaseAddress, HubRoutes.Game);

            return new HubConnectionBuilder()
                .WithUrl(url, options =>
                {
                    options.Transports = HttpTransportType.WebSockets;
                    options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                    options.WebSocketFactory = async (context, cancellationToken) =>
                        await server.CreateWebSocketClient().ConnectAsync(context.Uri, cancellationToken);

                    if (accessToken is not null)
                    {
                        options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
                    }
                })
                .Build();
        }
    }
}
