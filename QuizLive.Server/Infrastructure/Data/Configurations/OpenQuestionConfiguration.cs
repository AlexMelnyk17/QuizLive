using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.OpenText;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class OpenQuestionConfiguration : IEntityTypeConfiguration<OpenQuestion>
{
    public void Configure(EntityTypeBuilder<OpenQuestion> builder)
    {
        builder.ToTable("OpenQuestions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Text)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(q => q.ImageUrl)
            .HasMaxLength(500);

        builder.HasIndex(q => new { q.QuizId, q.Order })
            .IsUnique();

        builder.HasMany(q => q.Answers)
            .WithOne(a => a.Question)
            .HasForeignKey(a => a.OpenQuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
