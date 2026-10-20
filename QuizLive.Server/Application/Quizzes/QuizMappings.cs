using System.Linq.Expressions;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Application.Quizzes
{
    public static class QuizMappings
    {
        // Вираз, а не звичайний метод: EF перекладає його в SQL і читає з бази лише потрібні поля.
        // Заповнений лише один список питань (залежно від Kind), тому сума дорівнює кількості питань.
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
