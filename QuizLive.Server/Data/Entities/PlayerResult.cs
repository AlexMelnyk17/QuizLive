namespace QuizLive.Server.Data.Entities;

public class PlayerResult
{
    public int Id { get; set; }

    public int GameSessionRecordId { get; set; }

    public string Nickname { get; set; } = string.Empty;

    public int Score { get; set; }

    public int Rank { get; set; }

    public GameSessionRecord GameSessionRecord { get; set; } = null!;
}
