using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Entities.Quizzes;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Quizzes
{
    public class QuizService(AppDbContext db, ICurrentUser currentUser) : IQuizService
    {
        public async Task<List<QuizDto>> GetMyQuizzesAsync(bool? archived = null)
        {
            var userId = currentUser.UserId;

            var query = db.Quizzes
                .AsNoTracking()
                .Where(q => q.OwnerId == userId);

            // Без параметра повертаються всі квізи, і архівні, і активні.
            if (archived is not null)
            {
                query = query.Where(q => q.IsArchived == archived);
            }

            return await query
                .OrderByDescending(q => q.CreatedAtUtc)
                .Select(QuizMappings.ToDto)
                .ToListAsync();
        }

        public async Task<QuizDetailsDto> GetByIdAsync(int id)
        {
            var quiz = await GetDtoAsync(id);

            // Questions live in one of three tables depending on the kind, so they are loaded by a separate query.
            var questions = await QuestionQueries.ForQuiz(db, id, quiz.Kind).ToListAsync();

            return new QuizDetailsDto(
                quiz.Id,
                quiz.Title,
                quiz.Description,
                quiz.Kind,
                quiz.IsArchived,
                quiz.CreatedAtUtc,
                questions);
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

            return await GetDtoAsync(quiz.Id);
        }

        public async Task<QuizDto> UpdateAsync(int id, UpdateQuizRequest request)
        {
            var quiz = await FindOwnQuizAsync(id);
            await EnsureNoActiveGameAsync(id);

            quiz.Title = request.Title.Trim();
            quiz.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            await db.SaveChangesAsync();

            return await GetDtoAsync(id);
        }

        public async Task SetArchivedAsync(int id, bool isArchived)
        {
            var quiz = await FindOwnQuizAsync(id);

            quiz.IsArchived = isArchived;
            await db.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var quiz = await FindOwnQuizAsync(id);
            await EnsureNoActiveGameAsync(id);

            // Питання та їхні варіанти видаляються каскадно.
            db.Quizzes.Remove(quiz);
            await db.SaveChangesAsync();
        }

        // Гра посилається на питання за Order, тому поки гра не завершена, вміст квізу змінювати не можна.
        private async Task EnsureNoActiveGameAsync(int quizId)
        {
            var hasActiveGame = await db.GameSessionRecords.AnyAsync(g => g.QuizId == quizId && g.EndedAtUtc == null);
            if (hasActiveGame)
            {
                throw new ConflictException(QuizMessages.HasActiveGame);
            }
        }

        private async Task<QuizDto> GetDtoAsync(int id)
        {
            var userId = currentUser.UserId;

            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == id && q.OwnerId == userId)
                .Select(QuizMappings.ToDto)
                .FirstOrDefaultAsync();

            return quiz ?? throw new NotFoundException(QuizMessages.NotFound(id));
        }

        private async Task<Quiz> FindOwnQuizAsync(int id)
        {
            var userId = currentUser.UserId;

            return await db.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.OwnerId == userId)
                ?? throw new NotFoundException(QuizMessages.NotFound(id));
        }
    }
}
