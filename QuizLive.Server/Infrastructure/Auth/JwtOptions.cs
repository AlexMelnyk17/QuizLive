using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Infrastructure.Auth
{
    public class JwtOptions
    {
        public const string SectionName = "Jwt";

        [Required]
        public string Issuer { get; set; } = "";

        [Required]
        public string Audience { get; set; } = "";

        [Required]
        [MinLength(32)]
        public string Key { get; set; } = "";

        [Range(1, 1440)]
        public int ExpiresMinutes { get; set; } = 60;
    }
}
