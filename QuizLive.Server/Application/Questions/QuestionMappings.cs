using System.Linq.Expressions;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;

namespace QuizLive.Server.Application.Questions
{
    public static class QuestionMappings
    {
        // Відкрите питання: варіантів і балів немає.
        public static readonly Expression<Func<OpenQuestion, QuestionDto>> OpenToDto = question => new QuestionDto(
            question.Id,
            question.Order,
            question.Text,
            question.TimeLimitSeconds,
            null,
            question.ImageUrl,
            null);

        // Опитування: варіанти є, правильного немає.
        public static readonly Expression<Func<PollQuestion, QuestionDto>> PollToDto = question => new QuestionDto(
            question.Id,
            question.Order,
            question.Text,
            question.TimeLimitSeconds,
            null,
            question.ImageUrl,
            question.Options
                .OrderBy(o => o.Order)
                .Select(o => new OptionDto(o.Id, o.Order, o.Text, null))
                .ToList());

        public static readonly Expression<Func<QuizQuestion, QuestionDto>> QuizToDto = question => new QuestionDto(
            question.Id,
            question.Order,
            question.Text,
            question.TimeLimitSeconds,
            question.BasePoints,
            question.ImageUrl,
            question.Options
                .OrderBy(o => o.Order)
                .Select(o => new OptionDto(o.Id, o.Order, o.Text, o.IsCorrect))
                .ToList());
    }
}
