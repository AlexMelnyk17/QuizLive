namespace QuizLive.Server.Application.Games
{
    public static class GameMessages
    {
        public const string AlreadyStarted = "The game has already started.";
        public const string NoPlayers = "At least one player is needed to start the game.";
        public const string NoQuestions = "The quiz has no questions.";
        public const string HostOnly = "Only the host of the game can do this.";
        public const string QuestionNotOpen = "There is no open question to close.";
        public const string ResultsNotShown = "The next question can be shown only after the results of the current one.";
        public const string NoTimedQuestion = "There is no open question with a time limit.";
        public const string InvalidAddedTime = "The amount of time to add must be between 1 and 300 seconds.";

        public static string NotFound(int gameId) => $"Game {gameId} was not found.";
    }
}
