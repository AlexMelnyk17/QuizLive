namespace QuizLive.Server.Application.Quizzes
{
    public static class QuizMessages
    {
        public const string HasActiveGame = "The quiz has an active game and cannot be changed until the game ends.";
        public const string IsArchived = "An archived quiz cannot be changed.";
        public const string HasGames = "The quiz has played games and cannot be deleted. Archive it instead.";
        public const string ChangedConcurrently = "The quiz was changed by another request. Please try again.";

        public static string NotFound(int id) => $"Quiz {id} was not found.";
    }
}
