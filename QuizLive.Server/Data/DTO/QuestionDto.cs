using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Data.DTO
{
    public record ReadQuestionDto(
    int Id,
    string Text,
    string CorrectAnswer,
    int TimeLimitSeconds,
    int BasePoints,
    int Order,
    string? ImageUrl);

    public record CreateQuestionDto(
        [Required, MaxLength(1000)] string Text,
        [Required, MaxLength(200)] string CorrectAnswer,
        [Range(5, 300)] int TimeLimitSeconds,
        [Range(1, 10000)] int BasePoints,
        [MaxLength(500)] string? ImageUrl);
}
