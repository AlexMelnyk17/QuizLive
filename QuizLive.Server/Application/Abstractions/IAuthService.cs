using QuizLive.Server.Application.Auth;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);

        Task<AuthResponse> LoginAsync(LoginRequest request);

        Task<UserDto> GetCurrentUserAsync();
    }
}
