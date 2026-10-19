using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QuizLive.Server.Application.Abstractions;

namespace QuizLive.Server.Infrastructure.Auth
{
    public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
    {
        public string UserId
        {
            get
            {
                var userId = httpContextAccessor.HttpContext?.User
                .FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    throw new InvalidOperationException(
                        "Current user id is not available: the request is not authenticated.");
                }

                return userId;
            }
        }
    }
}
