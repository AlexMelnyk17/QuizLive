namespace QuizLive.Server.Application.Games
{
    public static class GameGroups
    {
        // Everyone connected to the game: the host and the players.
        public static string All(int gameId) => $"game:{gameId}";

        // The host only.
        public static string Host(int gameId) => $"game:{gameId}:host";
    }
}
