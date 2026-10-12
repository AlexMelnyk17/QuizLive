using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace QuizLive.Server.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder
            .UseSqlite("Data Source=quizlive.db")
            .AddInterceptors(new SqlitePragmaConnectionInterceptor());

        return new AppDbContext(optionsBuilder.Options);
    }
}
