using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Application.Questions
{
    // Тип питання визначає Kind квізу; відповідність полів типу перевіряє QuestionService.
    public record CreateQuestionRequest(
        [Required, StringLength(1000)] string Text,
        [Range(5, 300)] int? TimeLimitSeconds,
        [Range(0, 10000)] int? BasePoints,
        [StringLength(500), Url] string? ImageUrl,
        [MaxLength(10)] List<CreateOptionRequest>? Options);

    // Порядок варіантів береться з їхньої позиції в масиві Options.
    public record CreateOptionRequest(
        [Required, StringLength(300)] string Text,
        bool? IsCorrect);

    // Авторський DTO: містить IsCorrect.
    public record QuestionDto(
        int Id,
        int Order,
        string Text,
        int? TimeLimitSeconds,
        int? BasePoints,
        string? ImageUrl,
        List<OptionDto>? Options);

    public record OptionDto(
        int Id,
        int Order,
        string Text,
        bool? IsCorrect);
}
