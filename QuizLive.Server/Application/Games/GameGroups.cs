namespace QuizLive.Server.Application.Games
{
    public static class GameGroups
    {
        // Everyone connected to the game: the host and the players.
        public static string All(int gameId) => $"game:{gameId}";

        public static string Player(int gameId, int playerId) => $"game:{gameId}:player:{playerId}";

        // The host only.
        public static string Host(int gameId) => $"game:{gameId}:host";
    }
}
