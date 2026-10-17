using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;

namespace QuizLive.Server.Core.Entities.Games
{
    public class Player
    {
        public int Id { get; set; }
        public int GameSessionRecordId { get; set; }        // Cascade
        public GameSessionRecord GameSession { get; set; } = null!;
        public string Nickname { get; set; } = "";          // 40, унікальний у межах гри
        public string Token { get; set; } = Guid.NewGuid().ToString("N");   // 64
        public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;

        public List<OpenAnswer> OpenAnswers { get; set; } = new();
        public List<PollAnswer> PollAnswers { get; set; } = new();
        public List<QuizAnswer> QuizAnswers { get; set; } = new();
    }
}
