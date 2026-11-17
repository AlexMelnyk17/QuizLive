using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Tests.Database;

public class DatabaseInfrastructureTests
{
    [Theory]
    [InlineData(null, "Data Source=quizlive.db")]
    [InlineData("Data Source=:memory:", "Data Source=:memory:")]
    public void Registration_UsesConfiguredConnectionOrDefault_WithoutOpeningDatabase(string? configured, string expected)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Default"] = configured }).Build();
        using var services = new ServiceCollection().AddQuizLiveDbContext(configuration).BuildServiceProvider();
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", db.Database.ProviderName);
        Assert.Equal(expected, db.Database.GetConnectionString());
        Assert.Equal(System.Data.ConnectionState.Closed, db.Database.GetDbConnection().State);
    }

    [Fact]
    public void DesignTimeFactory_ConfiguresSqliteAndPragmaInterceptor_WithoutOpeningDevelopmentDatabase()
    {
        using var db = new AppDbContextFactory().CreateDbContext([]);

        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", db.Database.ProviderName);
        Assert.Equal("Data Source=quizlive.db", db.Database.GetConnectionString());
        Assert.Equal(System.Data.ConnectionState.Closed, db.Database.GetDbConnection().State);
        var options = db.GetService<IDbContextOptions>().FindExtension<CoreOptionsExtension>();
        Assert.Contains(options!.Interceptors!, interceptor => interceptor is SqlitePragmaConnectionInterceptor);
    }

    [Theory]
    [InlineData(2067, true)]
    [InlineData(787, false)]
    [InlineData(1555, false)]
    [InlineData(19, false)]
    public void UniqueViolation_RecognizesOnlySqliteUniqueConstraint(int extendedErrorCode, bool expected)
    {
        var error = new DbUpdateException("Save failed", new SqliteException("constraint", 19, extendedErrorCode));

        Assert.Equal(expected, error.IsUniqueViolation());
    }

    [Fact]
    public void UniqueViolation_DoesNotMisclassifyUnrelatedExceptions()
    {
        Assert.False(new DbUpdateException("Save failed").IsUniqueViolation());
        Assert.False(new DbUpdateException("Save failed", new InvalidOperationException()).IsUniqueViolation());
    }
}
