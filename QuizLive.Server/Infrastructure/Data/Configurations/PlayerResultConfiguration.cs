using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class PlayerResultConfiguration : IEntityTypeConfiguration<PlayerResult>
{
    public void Configure(EntityTypeBuilder<PlayerResult> builder)
    {
        builder.ToTable("PlayerResults");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nickname)
            .IsRequired()
            .HasMaxLength(40);
    }
}
