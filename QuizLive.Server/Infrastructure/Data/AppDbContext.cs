using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.Identity;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityUserContext<AppUser>(options)
{
    public DbSet<Quiz> Quizzes => Set<Quiz>();

    public DbSet<OpenQuestion> OpenQuestions => Set<OpenQuestion>();

    public DbSet<OpenAnswer> OpenAnswers => Set<OpenAnswer>();

    public DbSet<PollQuestion> PollQuestions => Set<PollQuestion>();

    public DbSet<PollOption> PollOptions => Set<PollOption>();

    public DbSet<PollAnswer> PollAnswers => Set<PollAnswer>();

    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();

    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();

    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();

    public DbSet<GameSessionRecord> GameSessionRecords => Set<GameSessionRecord>();

    public DbSet<Player> Players => Set<Player>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
