namespace QuizLive.Server.Data.Entities;

public class Question
{
    public int Id { get; set; }

    public int QuizId { get; set; }

    public string Text { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public QuestionKind Kind { get; set; } = QuestionKind.OpenText;

    public int TimeLimitSeconds { get; set; }

    public int BasePoints { get; set; }

    public int Order { get; set; }

    public string? ImageUrl { get; set; }

    public Quiz Quiz { get; set; } = null!;

    public ICollection<AnswerOption> Options { get; set; } = new List<AnswerOption>();
}
