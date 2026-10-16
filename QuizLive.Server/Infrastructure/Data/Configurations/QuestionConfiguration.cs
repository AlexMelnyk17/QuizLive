using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Text)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(q => q.CorrectAnswer)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(q => q.Kind)
            .HasDefaultValue(QuestionKind.OpenText);

        builder.Property(q => q.ImageUrl)
            .HasMaxLength(500);

        builder.HasIndex(q => new { q.QuizId, q.Order })
            .IsUnique();

        builder.HasMany(q => q.Options)
            .WithOne(o => o.Question)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
