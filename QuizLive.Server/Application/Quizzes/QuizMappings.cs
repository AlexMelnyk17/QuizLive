using System.Linq.Expressions;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Application.Quizzes
{
    public static class QuizMappings
    {
        public static readonly Expression<Func<Quiz, QuizDto>> ToDto = quiz => new QuizDto(
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.Kind,
            quiz.IsArchived,
            quiz.CreatedAtUtc,
            quiz.OpenQuestions.Count + quiz.PollQuestions.Count + quiz.QuizQuestions.Count);
    }
}
