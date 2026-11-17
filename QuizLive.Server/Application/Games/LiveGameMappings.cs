using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.Application.Games
{
    public static class LiveGameMappings
    {
        // Number is the question's Order within the quiz, the same value the game stores in CurrentQuestionOrder.
        public static QuestionViews ToViews(QuestionDto question, int total, DateTime startedAtUtc, DateTime? endsAtUtc, DateTime serverNowUtc)
        {
            var timing = new QuestionTimingDto(startedAtUtc, endsAtUtc, serverNowUtc);

            var forPlayers = new PlayerQuestionDto(
                question.Order,
                total,
                question.Text,
                question.ImageUrl,
                question.TimeLimitSeconds,
                question.Options?.Select(o => new PlayerOptionDto(o.Id, o.Order, o.Text)).ToList(),
                timing);

            var forHost = new HostQuestionDto(question.Order, total, question, timing);

            return new QuestionViews(forPlayers, forHost);
        }
    }
}
