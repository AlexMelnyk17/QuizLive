using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class AnswerRecordConfiguration : IEntityTypeConfiguration<AnswerRecord>
{
    public void Configure(EntityTypeBuilder<AnswerRecord> builder)
    {
        builder.ToTable("AnswerRecords");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.GameCode)
            .IsRequired()
            .HasMaxLength(6);

        builder.Property(a => a.PlayerToken)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(a => a.Nickname)
            .IsRequired()
            .HasMaxLength(40);

        builder.Property(a => a.SubmittedAnswer)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(a => a.GameCode);
    }
}
