namespace QuizLive.Server.Application.Games
{
    public static class GameMessages
    {
        public const string AlreadyStarted = "The game has already started.";
        public const string NoPlayers = "At least one player is needed to start the game.";
        public const string NoQuestions = "The quiz has no questions.";

        public static string NotFound(int gameId) => $"Game {gameId} was not found.";
    }
}
