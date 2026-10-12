namespace QuizLive.Server.Commands;

public static class DbCommandHost
{
    public static bool IsDbCommand(string[] args) =>
        args.Length >= 2 && string.Equals(args[0], "db", StringComparison.OrdinalIgnoreCase);

    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        var command = args[1];

        return command switch
        {
            "seed-demo" => await SeedDemoQuizHandler.RunAsync(cancellationToken),
            _ => UnknownCommand(command),
        };
    }

    private static int UnknownCommand(string command)
    {
        Console.Error.WriteLine($"Unknown database command: {command}");
        Console.Error.WriteLine("Usage: dotnet run --project QuizLive.Server -- db seed-demo");
        return 1;
    }
}
