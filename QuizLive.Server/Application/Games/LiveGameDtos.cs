using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.Application.Games
{
    // ServerNowUtc lets a client run the countdown from the server clock, not from its own.
    public record QuestionTimingDto(
        DateTime StartedAtUtc,
        DateTime? EndsAtUtc,
        DateTime ServerNowUtc);

    public record PlayerOptionDto(
        int Id,
        int Order,
        string Text);

    // The running question as a player sees it: no IsCorrect and no points.
    public record PlayerQuestionDto(
        int Number,
        int Total,
        string Text,
        string? ImageUrl,
        int? TimeLimitSeconds,
        List<PlayerOptionDto>? Options,
        QuestionTimingDto Timing);

    // The running question as the host sees it: the author version, with IsCorrect.
    public record HostQuestionDto(
        int Number,
        int Total,
        QuestionDto Question,
        QuestionTimingDto Timing);

    // The same question for the two audiences.
    public record QuestionViews(
        PlayerQuestionDto ForPlayers,
        HostQuestionDto ForHost);

    // The next question, or none when the last one was already shown and the game is finished.
    public record NextQuestionResult(QuestionViews? Question)
    {
        public bool Finished => Question is null;
    }
}
