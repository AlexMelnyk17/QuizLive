using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exeptions;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Quizzes
{
    public class QuizService(AppDbContext db, ICurrentUser currentUser) : IQuizService
    {
        public async Task<List<QuizDto>> GetMyQuizzesAsync()
        {
            var userId = currentUser.UserId;

            return await db.Quizzes
                .AsNoTracking()
                .Where(q => q.OwnerId == userId)
                .OrderByDescending(q => q.CreatedAtUtc)
                .Select(QuizMappings.ToDto)
                .ToListAsync();
        }

        public async Task<QuizDto> GetByIdAsync(int id)
        {
            var userId = currentUser.UserId;

            // Чужий квіз повертає таку саму 404, як і неіснуючий, щоб не розкривати, що він є.
            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == id && q.OwnerId == userId)
                .Select(QuizMappings.ToDto)
                .FirstOrDefaultAsync();

            return quiz ?? throw new NotFoundException($"Quiz {id} was not found.");
        }
    }
}
