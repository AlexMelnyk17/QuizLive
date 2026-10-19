namespace QuizLive.Server.Infrastructure.Auth
{
    public class JwtOptions
    {
        public const string SectionName = "Jwt";

        public string Issuer { get; set; } = "";
        public string Audience { get; set; } = "";
        public string Key { get; set; } = "";
        public int ExpiresMinutes { get; set; } = 60;
    }
}
