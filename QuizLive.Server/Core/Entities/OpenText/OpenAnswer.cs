using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Core.Entities.OpenText
{
    public class OpenAnswer
    {
        public long Id { get; set; }
        public int OpenQuestionId { get; set; }             // Cascade
        public OpenQuestion Question { get; set; } = null!;
        public int PlayerId { get; set; }                   // Cascade
        public Player Player { get; set; } = null!;
        public string Text { get; set; } = "";              // 200
        public bool IsHidden { get; set; }
        public DateTime AnsweredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
