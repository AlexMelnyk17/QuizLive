namespace QuizLive.Server.Infrastructure.Realtime
{
    public static class HubRoutes
    {
        // The prefix also tells JwtBearer where a token may come from the query string.
        public const string Prefix = "/api/hubs";
        public const string Game = Prefix + "/game";
    }
}
