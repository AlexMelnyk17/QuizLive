using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Core.Entities.QuizChoice
{
    public class QuizAnswer
    {
        public long Id { get; set; }
        public int QuizQuestionId { get; set; }             // Cascade
        public QuizQuestion Question { get; set; } = null!;
        public int PlayerId { get; set; }                   // Cascade
        public Player Player { get; set; } = null!;
        public int QuizOptionId { get; set; }               // Restrict
        public QuizOption Option { get; set; } = null!;
        public bool IsCorrect { get; set; }                 // вердикт на момент відповіді
        public int? ElapsedMs { get; set; }                 // рахує сервер
        public int? Points { get; set; }
        public DateTime AnsweredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
