using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.PollChoice;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class PollQuestionConfiguration : IEntityTypeConfiguration<PollQuestion>
{
    public void Configure(EntityTypeBuilder<PollQuestion> builder)
    {
        builder.ToTable("PollQuestions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Text)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(q => q.ImageUrl)
            .HasMaxLength(500);

        builder.HasIndex(q => new { q.QuizId, q.Order })
            .IsUnique();

        builder.HasMany(q => q.Options)
            .WithOne(o => o.Question)
            .HasForeignKey(o => o.PollQuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(q => q.Answers)
            .WithOne(a => a.Question)
            .HasForeignKey(a => a.PollQuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
