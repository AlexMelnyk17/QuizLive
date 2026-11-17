using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using QuizLive.Server.API.Hubs;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Infrastructure.Realtime;

namespace QuizLive.Server.Tests.Games;

public class SignalRGameNotifierTests
{
    private static readonly GamePlayerDto Player = new(5, "Anna", new DateTime(2026, 11, 17, 0, 0, 0, DateTimeKind.Utc));

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Notification_TargetsTheGamesPlayerAndHostGroups(bool ended)
    {
        var client = new RecordingClient();
        var clients = new GroupClients(client);
        var logger = new RecordingLogger();
        var notifier = new SignalRGameNotifier(new HubContext(clients), logger);

        if (ended) await notifier.GameEndedAsync(42);
        else await notifier.PlayerJoinedAsync(42, Player);

        Assert.Equal(["game:42", "game:42:host"], clients.RequestedGroups);
        Assert.Equal(ended ? 1 : 0, client.EndedCalls);
        Assert.Equal(ended ? [] : new[] { Player }, client.JoinedPlayers);
        Assert.Empty(logger.Warnings);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task FailedBroadcast_IsLoggedAndDoesNotFailTheSavedAction(bool ended, bool synchronousFailure)
    {
        var failure = new InvalidOperationException("Transport disconnected");
        var client = new RecordingClient { Failure = failure, SynchronousFailure = synchronousFailure };
        var logger = new RecordingLogger();
        var notifier = new SignalRGameNotifier(new HubContext(new GroupClients(client)), logger);

        if (ended) await notifier.GameEndedAsync(42);
        else await notifier.PlayerJoinedAsync(42, Player);

        var warning = Assert.Single(logger.Warnings);
        Assert.Same(failure, warning.Exception);
        Assert.Contains(ended ? nameof(IGameClient.GameEnded) : nameof(IGameClient.PlayerJoined), warning.Message);
        Assert.Contains("42", warning.Message);
    }

    [Fact]
    public async Task GroupResolutionFailure_IsAlsoLoggedWithoutEscaping()
    {
        var failure = new InvalidOperationException("Group unavailable");
        var logger = new RecordingLogger();
        var clients = new GroupClients(new RecordingClient()) { Failure = failure };
        var notifier = new SignalRGameNotifier(new HubContext(clients), logger);

        await notifier.GameEndedAsync(42);

        Assert.Same(failure, Assert.Single(logger.Warnings).Exception);
    }

    private sealed class RecordingClient : IGameClient
    {
        public List<GamePlayerDto> JoinedPlayers { get; } = [];
        public int EndedCalls { get; private set; }
        public Exception? Failure { get; init; }
        public bool SynchronousFailure { get; init; }

        public Task AnswerProgress(AnswerProgressDto progress) => Task.CompletedTask;
        public Task HostResults(HostQuestionResultsDto results) => Task.CompletedTask;
        public Task PlayerResults(PlayerQuestionResultsDto results) => Task.CompletedTask;
        public Task Leaderboard(LeaderboardDto leaderboard) => Task.CompletedTask;
        public Task TimeAdded(QuestionTimeAddedDto timing) => Task.CompletedTask;
        public Task PlayerPresenceChanged(PlayerPresenceDto presence) => Task.CompletedTask;
        public Task PlayerLeft(int playerId) => Task.CompletedTask;

        public Task PlayerJoined(GamePlayerDto player)
        {
            JoinedPlayers.Add(player);
            return Complete();
        }

        public Task GameEnded()
        {
            EndedCalls++;
            return Complete();
        }

        // Lobby tests must fail if a running-game event is unexpectedly sent instead.
        public Task QuestionShown(PlayerQuestionDto question) => throw new NotSupportedException("Unexpected QuestionShown event in lobby test.");
        public Task HostQuestionShown(HostQuestionDto question) => throw new NotSupportedException("Unexpected HostQuestionShown event in lobby test.");
        public Task QuestionClosed(int number) => throw new NotSupportedException("Unexpected QuestionClosed event in lobby test.");

        private Task Complete()
        {
            if (Failure is null) return Task.CompletedTask;
            if (SynchronousFailure) throw Failure;
            return Task.FromException(Failure);
        }
    }

    // Unexpected destinations fail immediately, so broadcasting to all games cannot silently pass.
    private sealed class GroupClients(IGameClient client) : IHubClients<IGameClient>
    {
        public List<string> RequestedGroups { get; } = [];
        public Exception? Failure { get; init; }
        public IGameClient Groups(IReadOnlyList<string> groupNames)
        {
            RequestedGroups.AddRange(groupNames);
            if (Failure is not null) throw Failure;
            return client;
        }
        public IGameClient All => throw new NotSupportedException();
        public IGameClient AllExcept(IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
        public IGameClient Client(string connectionId) => throw new NotSupportedException();
        public IGameClient Clients(IReadOnlyList<string> connectionIds) => throw new NotSupportedException();
        public IGameClient GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
        public IGameClient Group(string groupName) => throw new NotSupportedException();
        public IGameClient User(string userId) => throw new NotSupportedException();
        public IGameClient Users(IReadOnlyList<string> userIds) => throw new NotSupportedException();
    }

    private sealed class HubContext(IHubClients<IGameClient> clients) : IHubContext<GameHub, IGameClient>
    {
        public IHubClients<IGameClient> Clients => clients;
        public IGroupManager Groups => throw new NotSupportedException();
    }

    private sealed class RecordingLogger : ILogger<SignalRGameNotifier>
    {
        public List<(Exception? Exception, string Message)> Warnings { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Warning) Warnings.Add((exception, formatter(state, exception)));
        }
    }
}
