using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Application.Questions
{
    // Тип питання визначає Kind квізу; відповідність полів типу перевіряє QuestionService.
    public record QuestionRequest(
        [Required, StringLength(1000)] string Text,
        [Range(5, 300)] int? TimeLimitSeconds,
        [Range(0, 10000)] int? BasePoints,
        [StringLength(500), Url] string? ImageUrl,
        [MaxLength(10)] List<OptionRequest>? Options);

    // Порядок варіантів береться з їхньої позиції в масиві Options.
    public record OptionRequest(
        [Required, StringLength(300)] string Text,
        bool? IsCorrect);

    public record ReorderQuestionsRequest(
        [Required] List<int> QuestionIds);

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
