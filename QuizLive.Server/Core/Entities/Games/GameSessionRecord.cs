using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.Quizzes;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;


namespace QuizLive.Server.Core.Entities.Games;

public class GameSessionRecord
{
    public int Id { get; set; }
    public string Code { get; set; } = "";              // 6, унікальний серед активних ігор
                                                        // (індекс із фільтром EndedAtUtc IS NULL)
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;             // Restrict
    public string HostUserId { get; set; } = "";        // FK → AspNetUsers, Restrict
    public AppUser HostUser { get; set; } = null!;
    public GameStatus Status { get; set; } = GameStatus.Lobby;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }

    public List<Player> Players { get; set; } = new();
    public List<OpenAnswer> OpenAnswers { get; set; } = new();
    public List<PollAnswer> PollAnswers { get; set; } = new();
    public List<QuizAnswer> QuizAnswers { get; set; } = new();
}
