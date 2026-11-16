using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Core.Entities.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Questions
{
    public static class QuestionQueries
    {
        // The quiz kind decides which question table is read. Does not check quiz ownership.
        public static IQueryable<QuestionDto> ForQuiz(AppDbContext db, int quizId, QuizKind kind, int? questionId = null)
        {
            return kind switch
            {
                QuizKind.OpenText => Project(db.OpenQuestions, quizId, questionId, QuestionMappings.OpenToDto),
                QuizKind.PollChoice => Project(db.PollQuestions, quizId, questionId, QuestionMappings.PollToDto),
                QuizKind.QuizChoice => Project(db.QuizQuestions, quizId, questionId, QuestionMappings.QuizToDto),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }

        // The questionId filter goes before Select: after projecting into a record EF cannot translate q.Id to SQL.
        private static IQueryable<QuestionDto> Project<T>(
            IQueryable<T> questions,
            int quizId,
            int? questionId,
            Expression<Func<T, QuestionDto>> toDto)
            where T : Question
        {
            return questions
                .AsNoTracking()
                .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                .OrderBy(q => q.Order)
                .Select(toDto);
        }
    }
}
