using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Core.Entities.QuizChoice;

namespace QuizLive.Server.Core.Entities.Quizzes;

public class Quiz
{
    public int Id { get; set; }
    public string Title { get; set; } = "";             // 200
    public string? Description { get; set; }            // 2000
    public QuizKind Kind { get; set; }                  // не змінювати, коли є питання
    public string OwnerId { get; set; } = "";           // FK → AspNetUsers, Restrict
    public AppUser Owner { get; set; } = null!;
    public bool IsArchived { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<OpenQuestion> OpenQuestions { get; set; } = new();
    public List<PollQuestion> PollQuestions { get; set; } = new();
    public List<QuizQuestion> QuizQuestions { get; set; } = new();
    public List<GameSessionRecord> Games { get; set; } = new();
}