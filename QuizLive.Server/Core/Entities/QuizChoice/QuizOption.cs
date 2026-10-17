namespace QuizLive.Server.Core.Entities.QuizChoice
{
    public class QuizOption
    {
        public int Id { get; set; }
        public int QuizQuestionId { get; set; }             // Cascade, унікально з Order
        public QuizQuestion Question { get; set; } = null!;
        public string Text { get; set; } = "";              // 300
        public bool IsCorrect { get; set; }                 // частковий унікальний індекс по
                                                            // QuizQuestionId, де IsCorrect = 1
        public int Order { get; set; }

        public List<QuizAnswer> Answers { get; set; } = new();
    }
}
