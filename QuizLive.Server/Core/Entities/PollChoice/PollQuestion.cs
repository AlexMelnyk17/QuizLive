using QuizLive.Server.Core.Entities.Questions;
using QuizLive.Server.Core.Entities.Quizzes;
namespace QuizLive.Server.Core.Entities.PollChoice
{
    public class PollQuestion : Question
    {
        public Quiz Quiz { get; set; } = null!;

        public List<PollOption> Options { get; set; } = new();
        public List<PollAnswer> Answers { get; set; } = new();
    }
}
