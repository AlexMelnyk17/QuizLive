using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.QuizChoice;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class QuizAnswerConfiguration : IEntityTypeConfiguration<QuizAnswer>
{
    public void Configure(EntityTypeBuilder<QuizAnswer> builder)
    {
        builder.ToTable("QuizAnswers");

        builder.HasKey(a => a.Id);

        builder.HasIndex(a => new { a.PlayerId, a.QuizQuestionId })
            .IsUnique();
    }
}
