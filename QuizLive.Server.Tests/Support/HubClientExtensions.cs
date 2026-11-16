using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Infrastructure.Realtime;

namespace QuizLive.Server.Tests.Support
{
    public static class HubClientExtensions
    {
        // Connects to the in-memory test server. Only WebSockets are used: they send the token in the
        // query string (?access_token=), which is exactly the path the hub authentication has to handle.
        // Takes the base factory type, so it also works for a factory returned by WithWebHostBuilder.
        public static HubConnection CreateHubConnection(this WebApplicationFactory<Program> factory, string? accessToken = null)
        {
            var server = factory.Server;
            var url = new Uri(server.BaseAddress, HubRoutes.Game);

            return new HubConnectionBuilder()
                .WithUrl(url, options =>
                {
                    options.Transports = HttpTransportType.WebSockets;
                    options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                    // A custom factory bypasses the client's own token handling (the .NET client would send an
                    // Authorization header). A browser puts the token in the query, so that is what is done here.
                    options.WebSocketFactory = async (context, cancellationToken) =>
                    {
                        var uri = accessToken is null
                            ? context.Uri
                            : new UriBuilder(context.Uri)
                            {
                                Query = $"{context.Uri.Query.TrimStart('?')}&access_token={Uri.EscapeDataString(accessToken)}".TrimStart('&')
                            }.Uri;

                        return await server.CreateWebSocketClient().ConnectAsync(uri, cancellationToken);
                    };

                    if (accessToken is not null)
                    {
                        options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
                    }
                })
                .Build();
        }
    }
}
