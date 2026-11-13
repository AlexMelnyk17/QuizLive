using QuizLive.Server.Core.Entities.Questions;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Core.Entities.QuizChoice
{
    public class QuizQuestion : Question
    {
        public Quiz Quiz { get; set; } = null!;
        public int? BasePoints { get; set; }                // for scored mode

        public List<QuizOption> Options { get; set; } = new();
        public List<QuizAnswer> Answers { get; set; } = new();
    }
}
