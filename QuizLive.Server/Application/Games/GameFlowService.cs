using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Games
{
    // Every transition is compare-and-set: the UPDATE names the state the command expects, so a stale or
    // repeated command (for example from a second host tab) changes nothing and gets a conflict.
    public class GameFlowService(AppDbContext db) : IGameFlowService
    {
        public async Task<QuestionViews> StartAsync(int gameId, string hostUserId)
        {
            var game = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Id == gameId && g.HostUserId == hostUserId && g.EndedAtUtc == null)
                .Select(g => new { g.Status, g.QuizId, g.Quiz.Kind, PlayerCount = g.Players.Count })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException(GameMessages.NotFound(gameId));

            if (game.Status != GameStatus.Lobby)
            {
                throw new ConflictException(GameMessages.AlreadyStarted);
            }

            if (game.PlayerCount == 0)
            {
                throw new ConflictException(GameMessages.NoPlayers);
            }

            var questions = await QuestionQueries.ForQuiz(db, game.QuizId, game.Kind).ToListAsync();
            var first = questions.FirstOrDefault()
                ?? throw new ConflictException(GameMessages.NoQuestions);

            var startedAt = DateTime.UtcNow;
            DateTime? endsAt = first.TimeLimitSeconds is { } seconds ? startedAt.AddSeconds(seconds) : null;

            var changed = await db.GameSessionRecords
                .Where(g => g.Id == gameId && g.Status == GameStatus.Lobby && g.EndedAtUtc == null)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(g => g.Status, GameStatus.Question)
                    .SetProperty(g => g.StartedAtUtc, startedAt)
                    .SetProperty(g => g.CurrentQuestionOrder, first.Order)
                    .SetProperty(g => g.CurrentQuestionStartedAtUtc, startedAt)
                    .SetProperty(g => g.CurrentQuestionEndsAtUtc, endsAt));

            if (changed == 0)
            {
                throw new ConflictException(GameMessages.AlreadyStarted);
            }

            return LiveGameMappings.ToViews(first, questions.Count, startedAt, endsAt);
        }
    }
}
