using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Data.Entities;

namespace QuizLive.Server.Data.Configurations;

public class GameSessionRecordConfiguration : IEntityTypeConfiguration<GameSessionRecord>
{
    public void Configure(EntityTypeBuilder<GameSessionRecord> builder)
    {
        builder.ToTable("GameSessionRecords");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Code)
            .IsRequired()
            .HasMaxLength(6);

        builder.HasIndex(g => g.Code)
            .IsUnique();

        builder.HasMany(g => g.PlayerResults)
            .WithOne(p => p.GameSessionRecord)
            .HasForeignKey(p => p.GameSessionRecordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
