namespace QuizLive.Server.Core.Entities;

public class GameSessionRecord
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public int QuizId { get; set; }

    public DateTime StartedAtUtc { get; set; }

    public DateTime? EndedAtUtc { get; set; }

    public Quiz Quiz { get; set; } = null!;

    public ICollection<PlayerResult> PlayerResults { get; set; } = new List<PlayerResult>();
}
