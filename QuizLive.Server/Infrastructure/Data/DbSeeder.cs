using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Entities.Quizzes;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Infrastructure.Data;

public class DbSeeder(AppDbContext db, ILogger<DbSeeder> logger)
{
    private const string DemoUserName = "quizzer";
    private const string DemoPassword = "quiz123";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var owner = await SeedUserAsync(cancellationToken);

        var existingTitles = await db.Quizzes
            .Where(q => q.OwnerId == owner.Id)
            .Select(q => q.Title)
            .ToListAsync(cancellationToken);

        foreach (var quiz in BuildDemoQuizzes(owner.Id))
        {
            if (existingTitles.Contains(quiz.Title))
            {
                logger.LogInformation("Quiz '{Title}' already exists, skipping", quiz.Title);
                continue;
            }

            db.Quizzes.Add(quiz);
            logger.LogInformation("Seeding quiz '{Title}'", quiz.Title);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AppUser> SeedUserAsync(CancellationToken cancellationToken)
    {
        var normalizedUserName = DemoUserName.ToUpperInvariant();

        var user = await db.Users.FirstOrDefaultAsync(u => u.NormalizedUserName == normalizedUserName, cancellationToken);
        if (user is not null)
        {
            logger.LogInformation("User '{UserName}' already exists, skipping", DemoUserName);
            return user;
        }

        user = new AppUser
        {
            UserName = DemoUserName,
            NormalizedUserName = normalizedUserName,
            SecurityStamp = Guid.NewGuid().ToString("N"),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
        };
        user.PasswordHash = new PasswordHasher<AppUser>().HashPassword(user, DemoPassword);

        db.Users.Add(user);
        logger.LogInformation("Seeding user '{UserName}'", DemoUserName);
        return user;
    }

    private static IEnumerable<Quiz> BuildDemoQuizzes(string ownerId)
    {
        yield return new Quiz
        {
            Title = "Основи STEM",
            Description = "Демо-вікторина з одним правильним варіантом відповіді.",
            Kind = QuizKind.QuizChoice,
            OwnerId = ownerId,
            QuizQuestions =
            [
                QuizQuestion(1, "Яка хімічна формула води?", 1, "CO2", "H2O", "NaCl", "O2"),
                QuizQuestion(2, "Скільки буде 7 × 8?", 1, "54", "56", "58", "64"),
                QuizQuestion(3, "Яка планета найближча до Сонця?", 0, "Меркурій", "Венера", "Марс", "Земля"),
            ],
        };

        yield return new Quiz
        {
            Title = "Опитування: улюблений предмет",
            Description = "Демо-опитування без правильної відповіді.",
            Kind = QuizKind.PollChoice,
            OwnerId = ownerId,
            PollQuestions =
            [
                PollQuestion(1, "Який STEM-предмет вам найцікавіший?", "Математика", "Фізика", "Хімія", "Інформатика"),
                PollQuestion(2, "Як ви краще засвоюєте матеріал?", "Лекції", "Практика", "Відео", "Книги"),
                PollQuestion(3, "Скільки годин на тиждень ви програмуєте?", "Менше 2", "2–5", "5–10", "Більше 10"),
            ],
        };

        yield return new Quiz
        {
            Title = "Відкриті питання: рефлексія",
            Description = "Демо-вікторина з відкритими відповідями.",
            Kind = QuizKind.OpenText,
            OwnerId = ownerId,
            OpenQuestions =
            [
                new OpenQuestion { Order = 1, Text = "Що нового ви дізналися сьогодні?", TimeLimitSeconds = 60 },
                new OpenQuestion { Order = 2, Text = "Яка тема здалася найскладнішою?", TimeLimitSeconds = 60 },
                new OpenQuestion { Order = 3, Text = "Про що хочете дізнатися на наступному занятті?", TimeLimitSeconds = 60 },
            ],
        };
    }

    private static QuizQuestion QuizQuestion(int order, string text, int correctIndex, params string[] options) => new()
    {
        Order = order,
        Text = text,
        TimeLimitSeconds = 20,
        BasePoints = 1000,
        Options = options
            .Select((option, i) => new QuizOption { Order = i + 1, Text = option, IsCorrect = i == correctIndex })
            .ToList(),
    };

    private static PollQuestion PollQuestion(int order, string text, params string[] options) => new()
    {
        Order = order,
        Text = text,
        TimeLimitSeconds = 30,
        Options = options
            .Select((option, i) => new PollOption { Order = i + 1, Text = option })
            .ToList(),
    };
}
