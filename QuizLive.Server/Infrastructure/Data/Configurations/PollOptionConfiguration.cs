using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.PollChoice;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class PollOptionConfiguration : IEntityTypeConfiguration<PollOption>
{
    public void Configure(EntityTypeBuilder<PollOption> builder)
    {
        builder.ToTable("PollOptions");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Text)
            .IsRequired()
            .HasMaxLength(300);

        builder.HasIndex(o => new { o.PollQuestionId, o.Order })
            .IsUnique();

        builder.HasMany(o => o.Answers)
            .WithOne(a => a.Option)
            .HasForeignKey(a => a.PollOptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
