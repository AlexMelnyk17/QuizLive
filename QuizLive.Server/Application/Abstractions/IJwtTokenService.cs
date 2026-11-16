using QuizLive.Server.Core.Entities.Identity;

namespace QuizLive.Server.Application.Abstractions
{
    public record JwtToken(string Value, DateTime ExpiresAtUtc);

    public interface IJwtTokenService
    {
        JwtToken CreateToken(AppUser user);
    }
}
