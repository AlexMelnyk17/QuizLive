using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Data.DTO;
using QuizLive.Server.Data.Entities;
using QuizLive.Server.Mappings;
using QuizLive.Server.Data;

namespace QuizLive.Server.Services
{
    public class QuizRepository(AppDbContext db) : IQuizRepository
    {
        public Task<List<ReadQuizListItemDto>> GetListAsync(CancellationToken ct = default) =>
            db.Quizzes
                .AsNoTracking()
                .OrderByDescending(q => q.CreatedAtUtc)
                .Select(QuizMappings.ToListItem)
                .ToListAsync(ct);

        public Task<Quiz?> GetByIdAsync(int id, CancellationToken ct = default) =>
            db.Quizzes
                .AsNoTracking()
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == id, ct);

        public Task<Quiz?> GetByIdForUpdateAsync(int id, CancellationToken ct = default) =>
            db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == id, ct);

        public Task<bool> HasGameSessionsAsync(int id, CancellationToken ct = default) =>
            db.GameSessionRecords.AnyAsync(g => g.QuizId == id, ct);

        public async Task AddAsync(Quiz quiz, CancellationToken ct = default)
        {
            db.Quizzes.Add(quiz);
            await db.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(Quiz quiz, CancellationToken ct = default)
        {
            db.Quizzes.Remove(quiz);
            await db.SaveChangesAsync(ct);
        }

        public Task SaveChangesAsync(CancellationToken ct = default) =>
            db.SaveChangesAsync(ct);
    }
}
