using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Quizzes
{
    public static class QuizGuards
    {
        // Games refer to questions by Order, so quiz content is frozen while a game is running.
        public static async Task EnsureNoActiveGameAsync(AppDbContext db, int quizId)
        {
            var hasActiveGame = await db.GameSessionRecords.AnyAsync(g => g.QuizId == quizId && g.EndedAtUtc == null);

            if (hasActiveGame)
            {
                throw new ConflictException(QuizMessages.HasActiveGame);
            }
        }

        public static void EnsureNotArchived(bool isArchived)
        {
            if (isArchived)
            {
                throw new ConflictException(QuizMessages.IsArchived);
            }
        }
    }
}
