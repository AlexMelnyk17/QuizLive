using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using QuizLive.Server.Application.Abstractions;

namespace QuizLive.Server.Tests.Support
{
    public class QuizLiveFactory : WebApplicationFactory<Program>
    {
        public const string JwtKey = "quizlive-tests-signing-key-0123456789";

        public string DatabasePath { get; } = Path.Combine(Path.GetTempPath(), $"quizlive-tests-{Guid.NewGuid():N}.db");

        public FakeGameNotifier Notifier { get; } = new();

        // Tests of hub event delivery need the real notifier, so a derived factory can turn the fake off.
        protected virtual bool UseFakeNotifier => true;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // The connection string is read while services are registered, and only UseSetting is applied that early.
            // Jwt options are read later, and ConfigureAppConfiguration is the only source that wins over appsettings.Local.json.
            builder.UseSetting("ConnectionStrings:Default", $"Data Source={DatabasePath}");

            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = JwtKey
            }));

            if (UseFakeNotifier)
            {
                builder.ConfigureTestServices(services =>
                {
                    services.RemoveAll<IGameNotifier>();
                    services.AddSingleton<IGameNotifier>(Notifier);
                });
            }
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            if (!disposing)
            {
                return;
            }

            // Pooled connections keep the file locked on Windows.
            SqliteConnection.ClearAllPools();

            foreach (var path in new[] { DatabasePath, $"{DatabasePath}-wal", $"{DatabasePath}-shm" })
            {
                File.Delete(path);
            }
        }
    }
}
