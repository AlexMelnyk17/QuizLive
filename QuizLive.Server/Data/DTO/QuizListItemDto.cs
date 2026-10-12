using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Data.DTO
{
    //read: список
    public record QuizListItemDto(
        int Id,
        string Title,
        string? Description,
        DateTime CreatedAtUtc,
        int QuestionsCount);

    //read:один тест із деталями
    public record QuizDetailsDto(
        int Id,
        string Title,
        string? Description,
        DateTime CreatedAtUtc,
        IReadOnlyList<QuestionDto> Questions);

    public record CreateQuizDto(
        [Required, MaxLength(200)] string Title,
        [MaxLength(2000)] string? Description,
        [MinLength(1)] List<CreateQuestionDto> Questions);
}
