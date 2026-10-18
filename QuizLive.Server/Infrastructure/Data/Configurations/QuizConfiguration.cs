using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QuizLive.Server.Core.Entities.Quizzes;

namespace QuizLive.Server.Infrastructure.Data.Configurations;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable("Quizzes", t => t.HasCheckConstraint(
            "CK_Quizzes_Kind",
            "\"Kind\" IN ('OpenText','PollChoice','QuizChoice')"));

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Kind)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(q => q.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(q => q.Description)
            .HasMaxLength(2000);

        builder.HasOne(q => q.Owner)
            .WithMany(u => u.OwnedQuizzes)
            .HasForeignKey(q => q.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(q => q.OpenQuestions)
            .WithOne(q => q.Quiz)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(q => q.PollQuestions)
            .WithOne(q => q.Quiz)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(q => q.QuizQuestions)
            .WithOne(q => q.Quiz)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(q => q.Games)
            .WithOne(g => g.Quiz)
            .HasForeignKey(g => g.QuizId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
