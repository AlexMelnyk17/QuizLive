using System.ComponentModel.DataAnnotations;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Quizzes
{
    public record CreateQuizRequest(
        [Required, StringLength(200)] string Title,
        [StringLength(2000)] string? Description,
        [EnumDataType(typeof(QuizKind))] QuizKind Kind);

    public record UpdateQuizRequest(
        [Required, StringLength(200)] string Title,
        [StringLength(2000)] string? Description);

    public record QuizDto(
        int Id,
        string Title,
        string? Description,
        QuizKind Kind,
        bool IsArchived,
        DateTime CreatedAtUtc,
        int QuestionCount);

    // A single quiz with its content (author view: options include IsCorrect).
    public record QuizDetailsDto(
        int Id,
        string Title,
        string? Description,
        QuizKind Kind,
        bool IsArchived,
        DateTime CreatedAtUtc,
        List<QuestionDto> Questions);
}
