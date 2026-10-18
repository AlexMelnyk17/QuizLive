using QuizLive.Server.Core.Entities.Quizzes;
namespace QuizLive.Server.Core.Entities.OpenText
{
    public class OpenQuestion
    {
        public int Id { get; set; }
        public int QuizId { get; set; }                     // Cascade, унікально з Order
        public Quiz Quiz { get; set; } = null!;
        public string Text { get; set; } = "";              // 1000
        public int Order { get; set; }
        public int? TimeLimitSeconds { get; set; }
        public string? ImageUrl { get; set; }               // 500

        public List<OpenAnswer> Answers { get; set; } = new();
    }
}
