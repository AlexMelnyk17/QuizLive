using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Quizzes
{
    public record QuizDto(
        int Id,
        string Title,
        string? Description,
        QuizKind Kind,
        bool IsArchived,
        DateTime CreatedAtUtc,
        int QuestionCount);
}
