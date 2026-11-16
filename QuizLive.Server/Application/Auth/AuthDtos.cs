using System.ComponentModel.DataAnnotations;

namespace QuizLive.Server.Application.Auth
{
    public record RegisterRequest(
        [Required, StringLength(50, MinimumLength = 3)] string UserName,
        [Required, StringLength(100, MinimumLength = 6)] string Password);

    public record LoginRequest(
        [Required] string UserName,
        [Required] string Password);

    public record UserDto(string Id, string UserName);

    public record AuthResponse(string Token, DateTime ExpiresAtUtc, UserDto User);
}
