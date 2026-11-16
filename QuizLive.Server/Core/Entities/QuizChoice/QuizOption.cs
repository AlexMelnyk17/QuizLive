namespace QuizLive.Server.Core.Entities.QuizChoice
{
    public class QuizOption
    {
        public int Id { get; set; }
        public int QuizQuestionId { get; set; }             // Cascade, unique with Order
        public QuizQuestion Question { get; set; } = null!;
        public string Text { get; set; } = "";              // 300
        public bool IsCorrect { get; set; }                 // filtered unique index on
                                                            // QuizQuestionId where IsCorrect = 1
        public int Order { get; set; }

        public List<QuizAnswer> Answers { get; set; } = new();
    }
}
