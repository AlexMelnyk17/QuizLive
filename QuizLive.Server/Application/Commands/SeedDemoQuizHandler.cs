using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.Data.Seeding;

namespace QuizLive.Server.Application.Commands;

public static class SeedDemoQuizHandler
{
    public static async Task<int> RunAsync(CancellationToken cancellationToken = default)
    {
        var builder = Host.CreateApplicationBuilder();
        builder.Services.AddQuizLiveDbContext(builder.Configuration);

        using var host = builder.Build();

        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("QuizLive.Server.Commands.SeedDemoQuiz");

        await db.Database.MigrateAsync(cancellationToken);

        var seeded = await DemoQuizSeeder.SeedAsync(db, cancellationToken);
        if (seeded)
        {
            logger.LogInformation("Demo quiz seeded.");
            return 0;
        }

        logger.LogInformation("Demo quiz already present; nothing to seed.");
        return 0;
    }
}
