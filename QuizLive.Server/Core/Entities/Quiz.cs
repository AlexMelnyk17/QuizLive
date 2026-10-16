namespace QuizLive.Server.Core.Entities;

public class Quiz
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Question> Questions { get; set; } = new List<Question>();

    public ICollection<GameSessionRecord> GameSessions { get; set; } = new List<GameSessionRecord>();
}
