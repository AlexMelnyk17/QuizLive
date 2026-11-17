using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Entities.Quizzes;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Infrastructure.Data;

public class StatsDemoSeeder(AppDbContext db, ILogger<StatsDemoSeeder> logger)
{
    public const string TitlePrefix = "[Stats demo] ";

    private const string DemoUserName = "quizzer";
    private const string DemoPassword = "quiz123";

    private static readonly string[] NicknamePool =
    [
        "Anna", "Bohdan", "Chen", "Dana", "Erik", "Fatima", "Greta", "Hugo", "Ivy", "Jakob",
        "Kira", "Leo", "Mira", "Noah", "Olivia", "Pavel", "Quinn", "Rosa", "Sam", "Tara",
        "Uma", "Viktor", "Wren", "Xena", "Yuri", "Zoe", "Alex", "Blake", "Casey", "Drew",
    ];

    private static readonly string[] OpenTextPhrases =
    [
        "Більше практики", "Цікава лекція", "Потрібна перерва", "Все зрозуміло", "Складна тема",
        "Хочу прикладів", "Добре пояснили", "Швидкий темп", "More examples", "Clear slides",
        "Too fast", "Loved the demo", "Confusing part", "Will review notes", "Great host",
        "Більше практики", "Цікава лекція", "Great host", "Clear slides", "Too fast",
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var owner = await EnsureDemoUserAsync(cancellationToken);

        if (await db.Quizzes.AnyAsync(
                q => q.OwnerId == owner.Id && q.Title.StartsWith(TitlePrefix),
                cancellationToken))
        {
            logger.LogInformation("Stats demo quizzes already exist for '{User}', skipping", DemoUserName);
            return;
        }

        var quizzes = BuildStatsQuizzes(owner.Id).ToList();
        db.Quizzes.AddRange(quizzes);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Created {Count} stats demo quizzes", quizzes.Count);

        foreach (var quiz in quizzes)
        {
            await SeedGamesForQuizAsync(quiz.Id, quiz.Kind, owner.Id, cancellationToken);
        }

        logger.LogInformation("Stats demo games and answers seeded for '{User}'", DemoUserName);
    }

    private async Task<AppUser> EnsureDemoUserAsync(CancellationToken cancellationToken)
    {
        var normalizedUserName = DemoUserName.ToUpperInvariant();
        var user = await db.Users.FirstOrDefaultAsync(
            u => u.NormalizedUserName == normalizedUserName,
            cancellationToken);
        if (user is not null)
        {
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
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Created demo user '{UserName}'", DemoUserName);
        return user;
    }

    private static IEnumerable<Quiz> BuildStatsQuizzes(string ownerId)
    {
        for (var i = 1; i <= 4; i++)
        {
            yield return BuildQuizChoiceQuiz(ownerId, i);
            yield return BuildPollQuiz(ownerId, i);
            yield return BuildOpenTextQuiz(ownerId, i);
        }
    }

    private static Quiz BuildQuizChoiceQuiz(string ownerId, int index) => new()
    {
        Title = $"{TitlePrefix}Scored quiz {index}",
        Description = "Bulk demo data for statistics charts.",
        Kind = QuizKind.QuizChoice,
        OwnerId = ownerId,
        CreatedAtUtc = DateTime.UtcNow.AddDays(-90 + index),
        QuizQuestions =
        [
            QuizQuestion(1, $"Q{index}.1: Capital of France?", 2, "Berlin", "Madrid", "Paris", "Rome"),
            QuizQuestion(2, $"Q{index}.2: 12 + 15?", 0, "27", "25", "28", "30"),
            QuizQuestion(3, $"Q{index}.3: Largest ocean?", 1, "Atlantic", "Pacific", "Indian", "Arctic"),
            QuizQuestion(4, $"Q{index}.4: HTTP success code?", 2, "404", "500", "200", "301"),
        ],
    };

    private static Quiz BuildPollQuiz(string ownerId, int index) => new()
    {
        Title = $"{TitlePrefix}Poll {index}",
        Description = "Bulk demo poll for statistics.",
        Kind = QuizKind.PollChoice,
        OwnerId = ownerId,
        CreatedAtUtc = DateTime.UtcNow.AddDays(-90 + index),
        PollQuestions =
        [
            PollQuestion(1, $"Poll {index}: Favorite break activity?", "Walk", "Coffee", "Chat", "Music", "Stretch"),
            PollQuestion(2, $"Poll {index}: Preferred session length?", "30 min", "45 min", "60 min", "90 min"),
            PollQuestion(3, $"Poll {index}: Team size?", "2–5", "6–10", "11–20", "20+"),
        ],
    };

    private static Quiz BuildOpenTextQuiz(string ownerId, int index) => new()
    {
        Title = $"{TitlePrefix}Open text {index}",
        Description = "Bulk demo open answers for treemap stats.",
        Kind = QuizKind.OpenText,
        OwnerId = ownerId,
        CreatedAtUtc = DateTime.UtcNow.AddDays(-90 + index),
        OpenQuestions =
        [
            new OpenQuestion { Order = 1, Text = $"Reflection {index}: What went well?", TimeLimitSeconds = 60 },
            new OpenQuestion { Order = 2, Text = $"Reflection {index}: What was unclear?", TimeLimitSeconds = 60 },
            new OpenQuestion { Order = 3, Text = $"Reflection {index}: One improvement idea?", TimeLimitSeconds = 60 },
        ],
    };

    private async Task SeedGamesForQuizAsync(
        int quizId,
        QuizKind kind,
        string hostUserId,
        CancellationToken cancellationToken)
    {
        var gameCount = Random.Shared.Next(14, 22);

        for (var g = 0; g < gameCount; g++)
        {
            var dayOffset = Random.Shared.Next(0, 35);
            var hourOffset = Random.Shared.Next(8, 20);
            var created = DateTime.UtcNow.Date.AddDays(-dayOffset).AddHours(hourOffset).AddMinutes(Random.Shared.Next(0, 59));
            var durationMinutes = Random.Shared.Next(8, 42);
            var ended = created.AddMinutes(durationMinutes);

            var game = new GameSessionRecord
            {
                QuizId = quizId,
                HostUserId = hostUserId,
                Code = GameCodeGenerator.Generate(),
                Status = GameStatus.Finished,
                CreatedAtUtc = created,
                StartedAtUtc = created.AddMinutes(2),
                EndedAtUtc = ended,
            };

            var playerCount = Random.Shared.Next(5, 16);
            var nicknames = PickNicknames(playerCount);
            var players = nicknames.Select(n => new Player
            {
                Nickname = n,
                JoinedAtUtc = created.AddMinutes(Random.Shared.Next(1, 4)),
            }).ToList();
            game.Players = players;

            db.GameSessionRecords.Add(game);
            await db.SaveChangesAsync(cancellationToken);

            switch (kind)
            {
                case QuizKind.QuizChoice:
                    await AddQuizChoiceAnswersAsync(quizId, players, created, cancellationToken);
                    break;
                case QuizKind.PollChoice:
                    await AddPollAnswersAsync(quizId, players, created, cancellationToken);
                    break;
                case QuizKind.OpenText:
                    await AddOpenTextAnswersAsync(quizId, players, created, cancellationToken);
                    break;
            }
        }

        logger.LogInformation("Seeded {GameCount} finished games for quiz {QuizId}", gameCount, quizId);
    }

    private async Task AddQuizChoiceAnswersAsync(
        int quizId,
        List<Player> players,
        DateTime gameStart,
        CancellationToken cancellationToken)
    {
        var questions = await db.QuizQuestions
            .AsNoTracking()
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.Order)
            .Select(q => new { q.Id, q.BasePoints })
            .ToListAsync(cancellationToken);

        var options = await db.QuizOptions
            .AsNoTracking()
            .Where(o => o.Question.QuizId == quizId)
            .Select(o => new { o.Id, o.QuizQuestionId, o.IsCorrect })
            .ToListAsync(cancellationToken);

        var optionsByQuestion = options.GroupBy(o => o.QuizQuestionId).ToDictionary(g => g.Key, g => g.ToList());
        var answers = new List<QuizAnswer>();
        var answerOffset = 0;

        foreach (var question in questions)
        {
            var opts = optionsByQuestion[question.Id];
            var correct = opts.Single(o => o.IsCorrect);
            var wrong = opts.Where(o => !o.IsCorrect).ToList();

            foreach (var player in players)
            {
                var pickCorrect = Random.Shared.NextDouble() < 0.62;
                var chosen = pickCorrect ? correct : wrong[Random.Shared.Next(wrong.Count)];
                var basePoints = question.BasePoints ?? 1000;
                var points = chosen.IsCorrect ? basePoints / 10 : 0;
                var elapsed = Random.Shared.Next(3_000, 18_000);

                answers.Add(new QuizAnswer
                {
                    QuizQuestionId = question.Id,
                    PlayerId = player.Id,
                    QuizOptionId = chosen.Id,
                    IsCorrect = chosen.IsCorrect,
                    Points = points,
                    ElapsedMs = elapsed,
                    AnsweredAtUtc = gameStart.AddMinutes(5 + answerOffset / 30).AddSeconds(Random.Shared.Next(0, 40)),
                });
            }

            answerOffset++;
        }

        db.QuizAnswers.AddRange(answers);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task AddPollAnswersAsync(
        int quizId,
        List<Player> players,
        DateTime gameStart,
        CancellationToken cancellationToken)
    {
        var questions = await db.PollQuestions
            .AsNoTracking()
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.Order)
            .Select(q => q.Id)
            .ToListAsync(cancellationToken);

        var options = await db.PollOptions
            .AsNoTracking()
            .Where(o => o.Question.QuizId == quizId)
            .Select(o => new { o.Id, o.PollQuestionId })
            .ToListAsync(cancellationToken);

        var optionsByQuestion = options.GroupBy(o => o.PollQuestionId).ToDictionary(g => g.Key, g => g.ToList());
        var answers = new List<PollAnswer>();
        var offset = 0;

        foreach (var questionId in questions)
        {
            var opts = optionsByQuestion[questionId];
            foreach (var player in players)
            {
                var chosen = opts[Random.Shared.Next(opts.Count)];
                answers.Add(new PollAnswer
                {
                    PollQuestionId = questionId,
                    PlayerId = player.Id,
                    PollOptionId = chosen.Id,
                    AnsweredAtUtc = gameStart.AddMinutes(5 + offset).AddSeconds(Random.Shared.Next(0, 50)),
                });
            }

            offset++;
        }

        db.PollAnswers.AddRange(answers);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task AddOpenTextAnswersAsync(
        int quizId,
        List<Player> players,
        DateTime gameStart,
        CancellationToken cancellationToken)
    {
        var questions = await db.OpenQuestions
            .AsNoTracking()
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.Order)
            .Select(q => q.Id)
            .ToListAsync(cancellationToken);

        var answers = new List<OpenAnswer>();
        var offset = 0;

        foreach (var questionId in questions)
        {
            foreach (var player in players)
            {
                var text = OpenTextPhrases[Random.Shared.Next(OpenTextPhrases.Length)];
                if (Random.Shared.NextDouble() < 0.08)
                {
                    text = $"Detail from {player.Nickname}: {text}";
                }

                answers.Add(new OpenAnswer
                {
                    OpenQuestionId = questionId,
                    PlayerId = player.Id,
                    Text = text.Length > 200 ? text[..200] : text,
                    IsHidden = Random.Shared.NextDouble() < 0.05,
                    AnsweredAtUtc = gameStart.AddMinutes(5 + offset).AddSeconds(Random.Shared.Next(0, 50)),
                });
            }

            offset++;
        }

        db.OpenAnswers.AddRange(answers);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static List<string> PickNicknames(int count)
    {
        var pool = NicknamePool.OrderBy(_ => Random.Shared.Next()).Take(count).ToList();
        for (var i = pool.Count; i < count; i++)
        {
            pool.Add($"Guest{i + 1}");
        }

        return pool;
    }

    private static QuizQuestion QuizQuestion(int order, string text, int correctIndex, params string[] options) => new()
    {
        Order = order,
        Text = text,
        TimeLimitSeconds = 25,
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