using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Application.DTO
{
     public record ReadQuizListItemDto(
        int Id,
        string Title,
        string? Description,
        DateTime CreatedAtUtc,
        int QuestionsCount);

    public record ReadQuizDetailsDto(
        int Id,
        string Title,
        string? Description,
        DateTime CreatedAtUtc,
        IReadOnlyList<ReadQuestionDto> Questions);

    public record CreateQuizDto(
        [Required, MaxLength(200)] string Title,
        [MaxLength(2000)] string? Description,
        [Required, MinLength(1)] List<CreateQuestionDto> Questions);
}
