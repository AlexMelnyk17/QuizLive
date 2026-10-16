using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Core.Entities;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Infrastructure.Data.Seeding;

public static class DemoQuizSeeder
{
    /// <returns>True if a new demo quiz was inserted; false if data already existed.</returns>
    public static async Task<bool> SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Quizzes.AnyAsync(cancellationToken))
        {
            return false;
        }

        var quiz = new Quiz
        {
            Title = "Демо-тест",
            Description = "Демонстраційний тест для захисту лабораторної роботи.",
            CreatedAtUtc = DateTime.UtcNow,
            Questions =
            [
                new Question
                {
                    Text = "Столиця України?",
                    CorrectAnswer = "Київ",
                    Kind = QuestionKind.OpenText,
                    TimeLimitSeconds = 20,
                    BasePoints = 1000,
                    Order = 0,
                },
                new Question
                {
                    Text = "2 + 2 = ?",
                    CorrectAnswer = "4",
                    Kind = QuestionKind.OpenText,
                    TimeLimitSeconds = 20,
                    BasePoints = 1000,
                    Order = 1,
                },
                new Question
                {
                    Text = "Мова програмування для бекенду QuizLive?",
                    CorrectAnswer = "C#",
                    Kind = QuestionKind.OpenText,
                    TimeLimitSeconds = 20,
                    BasePoints = 1000,
                    Order = 2,
                },
            ],
        };

        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
