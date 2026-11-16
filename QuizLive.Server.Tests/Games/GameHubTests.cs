using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class GameHubTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private const string SecretDetail = "secret detail that must not reach the client";

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task ConnectAsPlayer_WithValidToken_ReturnsLobbyState()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var player = await host.JoinAsync(game.Code, "Ann");

            await using var connection = await StartAsync(factory);

            var state = await connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", player.Token, Ct);

            Assert.Equal(game.Id, state.GameId);
            Assert.Equal(game.Code, state.Code);
            Assert.Equal(GameStatus.Lobby, state.Status);
            Assert.Equal(player.PlayerId, state.PlayerId);
            Assert.Equal("Ann", state.Nickname);
            Assert.Equal(["Ann"], state.Players.Select(p => p.Nickname));
        }

        [Fact]
        public async Task ConnectAsPlayer_WithUnknownToken_ReturnsNotFoundMessage()
        {
            await using var connection = await StartAsync(factory);

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", "no-such-token", Ct));

            Assert.Contains("Player was not found.", error.Message);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task ConnectAsPlayer_WithEmptyToken_ReturnsValidationMessage(string token)
        {
            await using var connection = await StartAsync(factory);

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", token, Ct));

            Assert.Contains("Player token is required.", error.Message);
        }

        [Fact]
        public async Task ConnectAsPlayer_ForEndedGame_ReturnsNotFoundMessage()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            var player = await host.JoinAsync(game.Code, "Ann");
            await EndGameAsync(host, game.Id);

            await using var connection = await StartAsync(factory);

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", player.Token, Ct));

            Assert.Contains("Player was not found.", error.Message);
        }

        [Fact]
        public async Task ConnectAsHost_WithTokenInQuery_ReturnsGame()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");

            await using var connection = await StartAsync(factory, host.BearerToken());

            var result = await connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct);

            Assert.Equal(game.Id, result.Id);
            Assert.Equal(game.Code, result.Code);
            Assert.Equal(["Ann"], result.Players.Select(p => p.Nickname));
        }

        [Fact]
        public async Task ConnectAsHost_WithoutToken_IsRejected()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);

            await using var connection = await StartAsync(factory);

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct));

            // What the client sees is recorded here: [Authorize] rejects the call before the method runs.
            Assert.Contains("ConnectAsHost", error.Message);
        }

        [Fact]
        public async Task ConnectAsHost_WithForgedToken_IsRejected()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);

            var parts = host.BearerToken().Split('.');
            var forged = $"{parts[0]}.{parts[1]}.{new string('A', parts[2].Length)}";

            await using var connection = await StartAsync(factory, forged);

            await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct));
        }

        [Fact]
        public async Task ConnectAsHost_ForAnotherUsersGame_ReturnsNotFoundMessage()
        {
            var owner = await factory.CreateAuthorizedClientAsync();
            var quiz = await owner.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await owner.CreateGameAsync(quiz.Id);
            var stranger = await factory.CreateAuthorizedClientAsync();

            await using var connection = await StartAsync(factory, stranger.BearerToken());

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct));

            Assert.Contains($"Game {game.Id} was not found.", error.Message);
        }

        [Fact]
        public async Task ConnectAsHost_ForEndedGame_ReturnsNotFoundMessage()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.OpenText);
            var game = await host.CreateGameAsync(quiz.Id);
            await EndGameAsync(host, game.Id);

            await using var connection = await StartAsync(factory, host.BearerToken());

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<GameDto>("ConnectAsHost", game.Id, Ct));

            Assert.Contains($"Game {game.Id} was not found.", error.Message);
        }

        [Fact]
        public async Task UnexpectedException_ReachesTheClientAsGenericMessage_AndIsLogged()
        {
            var logs = new CapturingLoggerProvider();

            using var failingFactory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddLogging(logging => logging.AddProvider(logs));
                    services.RemoveAll<IGameService>();
                    services.AddScoped<IGameService, FailingGameService>();
                });
            });

            await using var connection = await StartAsync(failingFactory);

            var error = await Assert.ThrowsAsync<HubException>(
                () => connection.InvokeAsync<PlayerGameStateDto>("ConnectAsPlayer", "any-token", Ct));

            Assert.Contains("An unexpected error occurred", error.Message);
            Assert.DoesNotContain(SecretDetail, error.Message);

            var entry = Assert.Single(logs.Errors);
            Assert.Contains(SecretDetail, entry.Exception?.Message);
        }

        private static async Task<HubConnection> StartAsync(WebApplicationFactory<Program> app, string? accessToken = null)
        {
            var connection = app.CreateHubConnection(accessToken);
            await connection.StartAsync(Ct);
            return connection;
        }

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
        }

        // Only the hub entry point fails; everything else is never reached in this test.
        private class FailingGameService : IGameService
        {
            public Task<PlayerGameStateDto> GetPlayerStateAsync(string playerToken) =>
                throw new InvalidOperationException(SecretDetail);

            public Task<GameDto> CreateAsync(CreateGameRequest request) => throw new NotImplementedException();
            public Task<List<GameSummaryDto>> GetMyGamesAsync(int? quizId = null, GameStatus? status = null) => throw new NotImplementedException();
            public Task<GameDto> GetByIdAsync(int id) => throw new NotImplementedException();
            public Task EndAsync(int id) => throw new NotImplementedException();
            public Task<GameLookupDto> GetByCodeAsync(string code) => throw new NotImplementedException();
            public Task<JoinGameResponse> JoinAsync(string code, JoinGameRequest request) => throw new NotImplementedException();
            public Task<GameDto> GetActiveHostGameAsync(int gameId, string hostUserId) => throw new NotImplementedException();
            public Task EnsureActiveHostGameAsync(int gameId, string hostUserId) => throw new NotImplementedException();
            public Task<int> GetActivePlayerGameIdAsync(string playerToken) => throw new NotImplementedException();
        }

        private class CapturingLoggerProvider : ILoggerProvider
        {
            private readonly List<LogEntry> _errors = [];

            public IReadOnlyList<LogEntry> Errors
            {
                get
                {
                    lock (_errors)
                    {
                        return _errors.ToList();
                    }
                }
            }

            public ILogger CreateLogger(string categoryName) => new CapturingLogger(this, categoryName);

            public void Dispose()
            {
            }

            private void Add(LogEntry entry)
            {
                lock (_errors)
                {
                    _errors.Add(entry);
                }
            }

            private class CapturingLogger(CapturingLoggerProvider provider, string category) : ILogger
            {
                public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

                public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Error;

                public void Log<TState>(
                    LogLevel logLevel,
                    EventId eventId,
                    TState state,
                    Exception? exception,
                    Func<TState, Exception?, string> formatter)
                {
                    // Only the hub filter's errors: the test host also logs other categories.
                    if (logLevel >= LogLevel.Error && category.EndsWith(nameof(Infrastructure.ErrorHandling.HubExceptionFilter)))
                    {
                        provider.Add(new LogEntry(category, exception));
                    }
                }
            }
        }

        private record LogEntry(string Category, Exception? Exception);
    }
}
