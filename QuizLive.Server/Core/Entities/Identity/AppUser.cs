using Microsoft.AspNetCore.Identity;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Core.Entities.Identity
{
    public class AppUser : IdentityUser
    {
        // Вхід за UserName + пароль. Email не використовується.
        public List<Quiz> OwnedQuizzes { get; set; } = new();
        public List<GameSessionRecord> HostedGames { get; set; } = new();
    }
}
