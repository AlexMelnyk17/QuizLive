using QuizLive.Server.Data.DTO;
using QuizLive.Server.Data.Entities;
using System.Linq.Expressions;

namespace QuizLive.Server.Mappings
{
    public static class QuizMappings
    {
        public static readonly Expression<Func<Quiz, ReadQuizListItemDto>> ToListItem =
        q => new ReadQuizListItemDto(
            q.Id, q.Title, q.Description, q.CreatedAtUtc, q.Questions.Count);

        public static ReadQuestionDto ToDto(this Question q) => 
            new(q.Id, q.Text, q.CorrectAnswer, q.TimeLimitSeconds,
                q.BasePoints, q.Order, q.ImageUrl);

        public static ReadQuizDetailsDto ToDetailsDto(this Quiz q) =>
            new(q.Id, q.Title, q.Description, q.CreatedAtUtc,
                q.Questions.OrderBy(x => x.Order).Select(x => x.ToDto()).ToList());

        public static Question ToEntity(this CreateQuestionDto dto, int order) =>
            new()
            {
                Text = dto.Text,
                CorrectAnswer = dto.CorrectAnswer,
                TimeLimitSeconds = dto.TimeLimitSeconds,
                BasePoints = dto.BasePoints,
                ImageUrl = dto.ImageUrl,
                Order = order
            };

        public static Quiz ToEntity(this CreateQuizDto dto) =>
            new()
            {
                Title = dto.Title,
                Description = dto.Description,
                CreatedAtUtc = DateTime.UtcNow,
                Questions = dto.Questions
                    .Select((q, i) => q.ToEntity(i + 1))
                    .ToList()
            };
    }
}
