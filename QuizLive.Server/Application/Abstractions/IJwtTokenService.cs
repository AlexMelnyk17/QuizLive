using QuizLive.Server.Core.Entities.Identity;

namespace QuizLive.Server.Application.Abstractions
{
		public interface IJwtTokenService
		{
				string CreateToken(AppUser user);
		}
}
