namespace QuizLive.Server.Core.Entities.PollChoice
{
    public class PollOption
    {
        public int Id { get; set; }
        public int PollQuestionId { get; set; }             // Cascade, унікально з Order
        public PollQuestion Question { get; set; } = null!;
        public string Text { get; set; } = "";              // 300
        public int Order { get; set; }

        public List<PollAnswer> Answers { get; set; } = new();
    }
}
