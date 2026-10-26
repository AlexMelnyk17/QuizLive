using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.Quizzes;
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
    public int? CurrentQuestionOrder { get; set; }              // Order активного питання; null у Lobby
    public DateTime? CurrentQuestionStartedAtUtc { get; set; }  // коли сервер показав питання
    public DateTime? CurrentQuestionEndsAtUtc { get; set; }     // StartedAt + TimeLimitSeconds; null, якщо ліміту немає
    public DateTime? EndedAtUtc { get; set; }

    public List<Player> Players { get; set; } = new();
}
