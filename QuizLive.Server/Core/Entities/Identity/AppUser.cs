using Microsoft.AspNetCore.Identity;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Core.Entities.Identity
{
    public class AppUser : IdentityUser
    {
        // Login by UserName + password. Email is not used.
        public List<Quiz> OwnedQuizzes { get; set; } = new();
        public List<GameSessionRecord> HostedGames { get; set; } = new();
    }
}
