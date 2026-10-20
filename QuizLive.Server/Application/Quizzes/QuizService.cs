using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exeptions;
using QuizLive.Server.Core.Entities.Quizzes;
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

        public async Task<QuizDto> CreateAsync(CreateQuizRequest request)
        {
            var quiz = new Quiz
            {
                Title = request.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                Kind = request.Kind,
                OwnerId = currentUser.UserId
            };

            db.Quizzes.Add(quiz);
            await db.SaveChangesAsync();

            return await GetByIdAsync(quiz.Id);
        }

        public async Task DeleteAsync(int id)
        {
            var userId = currentUser.UserId;

            // Без AsNoTracking: Remove працює лише з об'єктом, який EF відстежує.
            var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.OwnerId == userId)
                ?? throw new NotFoundException($"Quiz {id} was not found.");

            // Питання та їхні варіанти видаляються каскадно.
            db.Quizzes.Remove(quiz);
            await db.SaveChangesAsync();
        }
    }
}
