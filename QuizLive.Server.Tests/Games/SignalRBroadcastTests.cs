using System.Net;
using Microsoft.AspNetCore.SignalR.Client;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games;

public class SignalRBroadcastTests(RealtimeQuizLiveFactory factory) : IClassFixture<RealtimeQuizLiveFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;
    private static readonly TimeSpan EventTimeout = TimeSpan.FromSeconds(5);

    [Fact]
    public async Task JoiningPlayer_IsBroadcastToConnectedHostAndExistingPlayer()
    {
        var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
        var game = await host.CreateGameAsync(quiz.Id);
        var existingPlayer = await factory.CreateClient().JoinAsync(game.Code, "Anna");
        await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
        await using var playerConnection = factory.CreateHubConnection();
        var hostEvent = new TaskCompletionSource<GamePlayerDto>(TaskCreationOptions.RunContinuationsAsynchronously);
        var playerEvent = new TaskCompletionSource<GamePlayerDto>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var hostSubscription = hostConnection.On<GamePlayerDto>(nameof(IGameClient.PlayerJoined), player => hostEvent.TrySetResult(player));
        using var playerSubscription = playerConnection.On<GamePlayerDto>(nameof(IGameClient.PlayerJoined), player => playerEvent.TrySetResult(player));
        await hostConnection.StartAsync(Ct);
        await playerConnection.StartAsync(Ct);
        await hostConnection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);
        await playerConnection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", existingPlayer.Token, Ct);

        var joined = await factory.CreateClient().JoinAsync(game.Code, "Bohdan");

        var delivered = await Task.WhenAll(hostEvent.Task, playerEvent.Task).WaitAsync(EventTimeout, Ct);
        Assert.All(delivered, player =>
        {
            Assert.Equal(joined.PlayerId, player.Id);
            Assert.Equal("Bohdan", player.Nickname);
            Assert.NotEqual(default, player.JoinedAtUtc);
        });
    }

    [Fact]
    public async Task EndingGame_IsBroadcastToConnectedHostAndPlayer()
    {
        var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(QuizKind.PollChoice);
        var game = await host.CreateGameAsync(quiz.Id);
        var player = await factory.CreateClient().JoinAsync(game.Code, "Anna");
        await using var hostConnection = factory.CreateHubConnection(host.BearerToken());
        await using var playerConnection = factory.CreateHubConnection();
        var hostEvent = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var playerEvent = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var hostSubscription = hostConnection.On(nameof(IGameClient.GameEnded), () => hostEvent.TrySetResult());
        using var playerSubscription = playerConnection.On(nameof(IGameClient.GameEnded), () => playerEvent.TrySetResult());
        await hostConnection.StartAsync(Ct);
        await playerConnection.StartAsync(Ct);
        await hostConnection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);
        await playerConnection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", player.Token, Ct);

        var response = await host.PostAsync($"/api/games/{game.Id}/end", null, Ct);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await Task.WhenAll(hostEvent.Task, playerEvent.Task).WaitAsync(EventTimeout, Ct);
        var savedGame = await (await host.GetAsync($"/api/games/{game.Id}", Ct)).ReadAsync<GameDto>(HttpStatusCode.OK);
        Assert.Equal(GameStatus.Finished, savedGame.Status);
        Assert.NotNull(savedGame.EndedAtUtc);
    }

}
