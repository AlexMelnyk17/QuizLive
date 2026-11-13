namespace QuizLive.Server.Application.Questions
{
    public static class QuestionMessages
    {
        public const string HasAnswers = "The question already has answers from played games and cannot be changed.";

        public const string ValidationFailed = "Question validation failed.";
        public const string PointsOnlyInQuizChoice = "Points are only used in quiz choice questions.";
        public const string OpenTextHasNoOptions = "Open text questions have no options.";
        public const string PollHasNoCorrectOption = "Poll options have no correct answer.";
        public const string IsCorrectRequired = "Specify whether the option is correct.";
        public const string ExactlyOneCorrect = "Exactly one option must be correct.";
        public const string OptionRequired = "Option must not be null.";
        public const string ImageUrlInvalid = "Image URL must be an absolute http or https link.";

        public const string OrderValidationFailed = "Question order validation failed.";
        public const string OrderMustListAll = "Every question of the quiz must be listed exactly once.";

        public static string NotFound(int id) => $"Question {id} was not found.";
        public static string MinOptions(int count) => $"At least {count} options are required.";
    }
}
