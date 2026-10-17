using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Core.Entities.PollChoice
{
    public class PollAnswer
    {
        public long Id { get; set; }
        public int PollQuestionId { get; set; }             // Cascade
        public PollQuestion Question { get; set; } = null!;
        public int PlayerId { get; set; }                   // Cascade
        public Player Player { get; set; } = null!;
        public int PollOptionId { get; set; }               // Restrict
        public PollOption Option { get; set; } = null!;
        public DateTime AnsweredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
