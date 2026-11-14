using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Games
{
    public class GameService(AppDbContext db, ICurrentUser currentUser, IGameNotifier notifier) : IGameService
    {
        private const int MaxCodeAttempts = 5;

        public async Task<GameDto> CreateAsync(CreateGameRequest request)
        {
            var userId = currentUser.UserId;

            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == request.QuizId && q.OwnerId == userId)
                .Select(q => new
                {
                    q.IsArchived,
                    QuestionCount = q.OpenQuestions.Count + q.PollQuestions.Count + q.QuizQuestions.Count
                })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException(QuizMessages.NotFound(request.QuizId));

            if (quiz.IsArchived)
            {
                throw new ConflictException("An archived quiz cannot be started.");
            }

            if (quiz.QuestionCount == 0)
            {
                throw new ConflictException("The quiz has no questions.");
            }

            var game = new GameSessionRecord
            {
                QuizId = request.QuizId,
                HostUserId = userId
            };

            db.GameSessionRecords.Add(game);

            // The filtered unique index on Code is the real guarantee: if two games get the same code
            // at the same time, the second insert fails and we retry with a new code.
            for (var attempt = 1; ; attempt++)
            {
                game.Code = GameCodeGenerator.Generate();

                try
                {
                    await db.SaveChangesAsync();
                    break;
                }
                catch (DbUpdateException ex) when (ex.IsUniqueViolation() && attempt < MaxCodeAttempts)
                {
                }
            }

            return await GetByIdAsync(game.Id);
        }

        public async Task<List<GameSummaryDto>> GetMyGamesAsync(int? quizId = null, GameStatus? status = null)
        {
            var userId = currentUser.UserId;

            var games = db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.HostUserId == userId);

            if (quizId is not null)
            {
                games = games.Where(g => g.QuizId == quizId);
            }

            if (status is not null)
            {
                games = games.Where(g => g.Status == status);
            }

            return await games
                .OrderByDescending(g => g.CreatedAtUtc)
                .ThenByDescending(g => g.Id)
                .Select(GameMappings.ToSummaryDto)
                .ToListAsync();
        }

        public async Task<GameDto> GetByIdAsync(int id)
        {
            var game = await HostGames(id, currentUser.UserId)
                .Select(GameMappings.ToDto)
                .FirstOrDefaultAsync();

            return game ?? throw new NotFoundException($"Game {id} was not found.");
        }

        public async Task<GameDto> GetActiveHostGameAsync(int gameId, string hostUserId)
        {
            var game = await HostGames(gameId, hostUserId)
                .Where(g => g.EndedAtUtc == null)
                .Select(GameMappings.ToDto)
                .FirstOrDefaultAsync();

            return game ?? throw new NotFoundException($"Game {gameId} was not found.");
        }

        public async Task<PlayerGameStateDto> GetPlayerStateAsync(string playerToken)
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
                .FirstOrDefaultAsync();

            return state ?? throw new NotFoundException("Player was not found.");
        }

        // The single ownership rule: a game is visible only to its host.
        private IQueryable<GameSessionRecord> HostGames(int gameId, string hostUserId) =>
            db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Id == gameId && g.HostUserId == hostUserId);

        public async Task EndAsync(int id)
        {
            var userId = currentUser.UserId;

            var game = await db.GameSessionRecords.FirstOrDefaultAsync(g => g.Id == id && g.HostUserId == userId)
                ?? throw new NotFoundException($"Game {id} was not found.");

            // Ending an already ended game is a no-op.
            if (game.EndedAtUtc is not null)
            {
                return;
            }

            // Setting EndedAtUtc frees the code for new games.
            game.Status = GameStatus.Finished;
            game.EndedAtUtc = DateTime.UtcNow;

            await db.SaveChangesAsync();
            await notifier.GameEndedAsync(id);
        }

        public async Task<GameLookupDto> GetByCodeAsync(string code)
        {
            var normalized = GameCodeGenerator.Normalize(code);

            var game = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Code == normalized && g.EndedAtUtc == null)
                .Select(g => new GameLookupDto(g.Code, g.Quiz.Title, g.Status))
                .FirstOrDefaultAsync();

            return game ?? throw new NotFoundException($"Game with code {normalized} was not found.");
        }

        public async Task<JoinGameResponse> JoinAsync(string code, JoinGameRequest request)
        {
            var nickname = request.Nickname.Trim();

            if (nickname.Length == 0)
            {
                throw new DomainValidationException(
                    "Nickname is required.",
                    new Dictionary<string, string[]> { ["nickname"] = ["Nickname is required."] });
            }

            var normalized = GameCodeGenerator.Normalize(code);

            var game = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Code == normalized && g.EndedAtUtc == null)
                .Select(g => new { g.Id, g.Status })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException($"Game with code {normalized} was not found.");

            if (game.Status != GameStatus.Lobby)
            {
                throw new ConflictException("The game has already started.");
            }

            // Compared in memory: SQLite lower() only handles ASCII, so it would miss Cyrillic nicknames.
            // A lobby is small, so loading its nicknames is cheap.
            var nicknames = await db.Players
                .Where(p => p.GameSessionRecordId == game.Id)
                .Select(p => p.Nickname)
                .ToListAsync();

            if (nicknames.Contains(nickname, StringComparer.OrdinalIgnoreCase))
            {
                throw new ConflictException($"The nickname \"{nickname}\" is already taken in this game.");
            }

            var player = new Player
            {
                GameSessionRecordId = game.Id,
                Nickname = nickname
            };

            db.Players.Add(player);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // Another player took the same nickname between the check and the insert.
                throw new ConflictException($"The nickname \"{nickname}\" is already taken in this game.");
            }

            await notifier.PlayerJoinedAsync(game.Id, new GamePlayerDto(player.Id, player.Nickname, player.JoinedAtUtc));

            return new JoinGameResponse(game.Id, player.Id, player.Nickname, player.Token);
        }
    }
}
