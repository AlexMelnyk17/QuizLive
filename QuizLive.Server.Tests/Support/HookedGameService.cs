using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Tests.Support
{
    // Lets a test run code at an exact moment inside a hub call: right after the lobby state has been read,
    // which is the window in which a player can join and be missing from both the snapshot and the event.
    public class GameServiceHooks
    {
        public Func<Task>? AfterStateRead { get; set; }

        internal async Task RunAfterStateReadAsync()
        {
            var hook = AfterStateRead;
            AfterStateRead = null;

            if (hook is not null)
            {
                await hook();
            }
        }
    }

    // The real GameService with hooks; it changes nothing else.
    public class HookedGameService(GameService inner, GameServiceHooks hooks) : IGameService
    {
        public static void Register(IServiceCollection services, GameServiceHooks hooks)
        {
            services.AddSingleton(hooks);
            services.AddScoped<IGameService>(sp =>
                new HookedGameService(ActivatorUtilities.CreateInstance<GameService>(sp), hooks));
        }

        public async Task<GameDto> GetActiveHostGameAsync(int gameId, string hostUserId)
        {
            var game = await inner.GetActiveHostGameAsync(gameId, hostUserId);
            await hooks.RunAfterStateReadAsync();
            return game;
        }

        public async Task<PlayerGameStateDto> GetPlayerStateAsync(string playerToken)
        {
            var state = await inner.GetPlayerStateAsync(playerToken);
            await hooks.RunAfterStateReadAsync();
            return state;
        }

        public Task<GameDto> CreateAsync(CreateGameRequest request) => inner.CreateAsync(request);
        public Task<List<GameSummaryDto>> GetMyGamesAsync(int? quizId = null, GameStatus? status = null) => inner.GetMyGamesAsync(quizId, status);
        public Task<GameDto> GetByIdAsync(int id) => inner.GetByIdAsync(id);
        public Task EndAsync(int id) => inner.EndAsync(id);
        public Task<GameLookupDto> GetByCodeAsync(string code) => inner.GetByCodeAsync(code);
        public Task<JoinGameResponse> JoinAsync(string code, JoinGameRequest request) => inner.JoinAsync(code, request);
        public Task EnsureActiveHostGameAsync(int gameId, string hostUserId) => inner.EnsureActiveHostGameAsync(gameId, hostUserId);
        public Task<int> GetActivePlayerGameIdAsync(string playerToken) => inner.GetActivePlayerGameIdAsync(playerToken);
    }
}
