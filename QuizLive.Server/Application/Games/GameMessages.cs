namespace QuizLive.Server.Application.Games
{
    public static class GameMessages
    {
        public const string AlreadyStarted = "The game has already started.";
        public const string NoPlayers = "At least one player is needed to start the game.";
        public const string NoQuestions = "The quiz has no questions.";
        public const string QuestionNotOpen = "There is no open question to close.";
        public const string ResultsNotShown = "The next question can be shown only after the results of the current one.";

        public static string NotFound(int gameId) => $"Game {gameId} was not found.";
    }
}
