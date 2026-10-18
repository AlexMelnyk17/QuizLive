using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.QuizChoice;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class QuizOptionConfiguration : IEntityTypeConfiguration<QuizOption>
{
    public void Configure(EntityTypeBuilder<QuizOption> builder)
    {
        builder.ToTable("QuizOptions");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Text)
            .IsRequired()
            .HasMaxLength(300);

        builder.HasIndex(o => new { o.QuizQuestionId, o.Order })
            .IsUnique();

        // At most one correct option per question.
        builder.HasIndex(o => o.QuizQuestionId)
            .IsUnique()
            .HasFilter("\"IsCorrect\" = 1")
            .HasDatabaseName("IX_QuizOptions_QuizQuestionId_Correct");

        builder.HasMany(o => o.Answers)
            .WithOne(a => a.Option)
            .HasForeignKey(a => a.QuizOptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
