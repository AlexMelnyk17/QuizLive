using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Commands;

public static class DbCommandHost
{
    public static bool IsDbCommand(string[] args) =>
        args.Length >= 2 && string.Equals(args[0], "db", StringComparison.OrdinalIgnoreCase);

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        var command = args[1];

        return command.ToLowerInvariant() switch
        {
            "seed" => await SeedAsync(args[2..], cancellationToken),
            _ => UnknownCommand(command),
        };
    }

    private static async Task<int> SeedAsync(string[] args, CancellationToken cancellationToken)
    {
        var builder = Host.CreateApplicationBuilder(args);

        builder.Services.AddQuizLiveDbContext(builder.Configuration);
        builder.Services.AddScoped<DbSeeder>();

        using var host = builder.Build();
        using var scope = host.Services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync(cancellationToken);

        await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync(cancellationToken);

        Console.WriteLine("Database seeded successfully.");
        return 0;
    }

    private static int UnknownCommand(string command)
    {
        Console.Error.WriteLine($"Unknown database command: {command}");
        Console.Error.WriteLine("Available commands: seed");
        return 1;
    }
}
