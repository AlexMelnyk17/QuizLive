using Microsoft.EntityFrameworkCore;

namespace QuizLive.Server.Infrastructure.Data;

public static class DbContextRegistrationExtensions
{
    private static readonly SqlitePragmaConnectionInterceptor PragmaInterceptor = new();

    public static IServiceCollection AddQuizLiveDbContext(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default") ?? "Data Source=quizlive.db";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connectionString).AddInterceptors(PragmaInterceptor));

        return services;
    }
}
