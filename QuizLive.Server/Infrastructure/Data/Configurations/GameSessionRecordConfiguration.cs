using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class GameSessionRecordConfiguration : IEntityTypeConfiguration<GameSessionRecord>
{
    public void Configure(EntityTypeBuilder<GameSessionRecord> builder)
    {
        builder.ToTable("GameSessionRecords", t => t.HasCheckConstraint(
            "CK_GameSessionRecords_Status",
            "\"Status\" IN ('Lobby','Question','Results','Finished')"));

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(g => g.Code)
            .IsRequired()
            .HasMaxLength(6);

        // The code only has to be unique among games that are still running.
        builder.HasIndex(g => g.Code)
            .IsUnique()
            .HasFilter("\"EndedAtUtc\" IS NULL");

        builder.HasOne(g => g.HostUser)
            .WithMany(u => u.HostedGames)
            .HasForeignKey(g => g.HostUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(g => g.Players)
            .WithOne(p => p.GameSession)
            .HasForeignKey(p => p.GameSessionRecordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
