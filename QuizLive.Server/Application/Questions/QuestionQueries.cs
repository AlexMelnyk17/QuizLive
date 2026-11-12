using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Questions
{
    public static class QuestionQueries
    {
        // The quiz kind decides which question table is read. Does not check quiz ownership.
        // The questionId filter goes before Select: after projecting into a record EF cannot translate q.Id to SQL.
        public static IQueryable<QuestionDto> ForQuiz(AppDbContext db, int quizId, QuizKind kind, int? questionId = null)
        {
            return kind switch
            {
                QuizKind.OpenText => db.OpenQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.OpenToDto),

                QuizKind.PollChoice => db.PollQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.PollToDto),

                QuizKind.QuizChoice => db.QuizQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.QuizToDto),

                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }
    }
}
