using Microsoft.AspNetCore.Identity;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Core.Entities.Identity;

namespace QuizLive.Server.Application.Auth
{
    public class AuthService(
        UserManager<AppUser> userManager,
        IJwtTokenService tokenService,
        ICurrentUser currentUser) : IAuthService
    {
        private const string InvalidCredentialsMessage = "Invalid user name or password.";

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var user = new AppUser { UserName = request.UserName };

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                throw ToException(result.Errors);
            }

            return CreateResponse(user);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await userManager.FindByNameAsync(request.UserName);
            if (user is null)
            {
                throw new UnauthorizedException(InvalidCredentialsMessage);
            }

            if (await userManager.IsLockedOutAsync(user))
            {
                throw new UnauthorizedException("Account is temporarily locked. Try again later.");
            }

            if (!await userManager.CheckPasswordAsync(user, request.Password))
            {
                await userManager.AccessFailedAsync(user);
                throw new UnauthorizedException(InvalidCredentialsMessage);
            }

            await userManager.ResetAccessFailedCountAsync(user);

            return CreateResponse(user);
        }

        public async Task<UserDto> GetCurrentUserAsync()
        {
            var user = await userManager.FindByIdAsync(currentUser.UserId);
            if (user is null)
            {
                throw new UnauthorizedException("User no longer exists.");
            }

            return user.ToDto();
        }

        private AuthResponse CreateResponse(AppUser user)
        {
            var token = tokenService.CreateToken(user);
            return new AuthResponse(token.Value, token.ExpiresAtUtc, user.ToDto());
        }

        private static Exception ToException(IEnumerable<IdentityError> identityErrors)
        {
            var errors = identityErrors.ToList();

            if (errors.Any(e => e.Code == nameof(IdentityErrorDescriber.DuplicateUserName)))
            {
                return new ConflictException("User name is already taken.");
            }

            var byField = errors
                .GroupBy(e => e.Code.StartsWith("Password", StringComparison.Ordinal) ? "password" : "userName")
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            return new DomainValidationException("Registration failed.", byField);
        }
    }
}
