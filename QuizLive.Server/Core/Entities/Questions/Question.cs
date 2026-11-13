namespace QuizLive.Server.Core.Entities.Questions
{
    // Fields shared by OpenQuestion, PollQuestion and QuizQuestion; each kind keeps its own table.
    // Do not add DbSet<Question> or configure it as an entity: EF would merge the kinds into one table.
    public abstract class Question
    {
        public int Id { get; set; }
        public int QuizId { get; set; }                     // Cascade, unique with Order
        public string Text { get; set; } = "";              // 1000
        public int Order { get; set; }
        public int? TimeLimitSeconds { get; set; }
        public string? ImageUrl { get; set; }               // 500
    }
}
