namespace QuizLive.Server.Core.Entities;

public class AnswerRecord
{
    public long Id { get; set; }

    public string GameCode { get; set; } = string.Empty;

    public int QuestionIndex { get; set; }

    public string PlayerToken { get; set; } = string.Empty;

    public string Nickname { get; set; } = string.Empty;

    public string SubmittedAnswer { get; set; } = string.Empty;

    public int? OptionId { get; set; }

    public bool IsCorrect { get; set; }

    public int ElapsedMs { get; set; }

    public int Points { get; set; }

    public DateTime AnsweredAtUtc { get; set; }
}
