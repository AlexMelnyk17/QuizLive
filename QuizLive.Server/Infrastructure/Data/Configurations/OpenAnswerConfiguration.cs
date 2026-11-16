using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.OpenText;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class OpenAnswerConfiguration : IEntityTypeConfiguration<OpenAnswer>
{
    public void Configure(EntityTypeBuilder<OpenAnswer> builder)
    {
        builder.ToTable("OpenAnswers");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Text)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(a => new { a.PlayerId, a.OpenQuestionId })
            .IsUnique();
    }
}
