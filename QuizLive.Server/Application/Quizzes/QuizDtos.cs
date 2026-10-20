using System.ComponentModel.DataAnnotations;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Quizzes
{
    public record CreateQuizRequest(
        [Required, StringLength(200)] string Title,
        [StringLength(2000)] string? Description,
        [EnumDataType(typeof(QuizKind))] QuizKind Kind);

    public record QuizDto(
        int Id,
        string Title,
        string? Description,
        QuizKind Kind,
        bool IsArchived,
        DateTime CreatedAtUtc,
        int QuestionCount);
}
