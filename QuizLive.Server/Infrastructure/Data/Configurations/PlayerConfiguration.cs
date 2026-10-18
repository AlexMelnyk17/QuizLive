using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class PlayerConfiguration : IEntityTypeConfiguration<Player>
{
    public void Configure(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("Players");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nickname)
            .IsRequired()
            .HasMaxLength(40);

        builder.Property(p => p.Token)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(p => new { p.GameSessionRecordId, p.Nickname })
            .IsUnique();

        builder.HasIndex(p => p.Token)
            .IsUnique();

        builder.HasMany(p => p.OpenAnswers)
            .WithOne(a => a.Player)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.PollAnswers)
            .WithOne(a => a.Player)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.QuizAnswers)
            .WithOne(a => a.Player)
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
