using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Data.Entities;

namespace QuizLive.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Quiz> Quizzes => Set<Quiz>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();

    public DbSet<GameSessionRecord> GameSessionRecords => Set<GameSessionRecord>();

    public DbSet<PlayerResult> PlayerResults => Set<PlayerResult>();

    public DbSet<AnswerRecord> AnswerRecords => Set<AnswerRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
