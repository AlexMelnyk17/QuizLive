using QuizLive.Server.Core.Entities.Questions;
using QuizLive.Server.Core.Entities.Quizzes;
namespace QuizLive.Server.Core.Entities.OpenText
{
    public class OpenQuestion : Question
    {
        public Quiz Quiz { get; set; } = null!;

        public List<OpenAnswer> Answers { get; set; } = new();
    }
}
