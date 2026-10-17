using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.PollChoice;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class PollAnswerConfiguration : IEntityTypeConfiguration<PollAnswer>
{
    public void Configure(EntityTypeBuilder<PollAnswer> builder)
    {
        builder.ToTable("PollAnswers");

        builder.HasKey(a => a.Id);

        builder.HasIndex(a => new { a.PlayerId, a.PollQuestionId })
            .IsUnique();
    }
}
