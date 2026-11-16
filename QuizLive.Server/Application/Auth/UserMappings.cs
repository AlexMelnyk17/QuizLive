using QuizLive.Server.Core.Entities.Identity;

namespace QuizLive.Server.Application.Auth
{
    public static class UserMappings
    {
        public static UserDto ToDto(this AppUser user) =>
            new(user.Id, user.UserName ?? string.Empty);
    }
}
