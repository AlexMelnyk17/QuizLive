using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Core.Entities.QuizChoice
{
    public class QuizQuestion
    {
        public int Id { get; set; }
        public int QuizId { get; set; }                     // Cascade, унікально з Order
        public Quiz Quiz { get; set; } = null!;
        public string Text { get; set; } = "";              // 1000
        public int Order { get; set; }
        public int? TimeLimitSeconds { get; set; }
        public int? BasePoints { get; set; }                // для режиму з балами
        public string? ImageUrl { get; set; }               // 500

        public List<QuizOption> Options { get; set; } = new();
        public List<QuizAnswer> Answers { get; set; } = new();
    }
}
