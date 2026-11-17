using QuizLive.Server.Application.Commands;

namespace QuizLive.Server.Tests.Database;

public class DbCommandHostTests
{
    [Theory]
    [InlineData(new string[0], false)]
    [InlineData(new[] { "db" }, false)]
    [InlineData(new[] { "serve", "seed" }, false)]
    [InlineData(new[] { "db", "seed" }, true)]
    [InlineData(new[] { "DB", "SEED-STATS" }, true)]
    public void CommandDetection_RequiresDbPrefixAndSubcommand(string[] args, bool expected)
    {
        Assert.Equal(expected, DbCommandHost.IsDbCommand(args));
    }

    [Fact]
    public async Task UnknownDatabaseCommand_ReturnsFailureWithoutStartingWebHost()
    {
        Assert.Equal(1, await Program.Main(["db", "unsupported-command"]));
    }
}
