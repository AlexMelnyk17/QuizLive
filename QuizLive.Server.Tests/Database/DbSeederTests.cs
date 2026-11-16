using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Auth;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Database
{
    // Runs the real `db seed` command against the factory's temporary database.
    public class DbSeederTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task Seed_CreatesDemoUserWithOneQuizPerKind()
        {
            await RunSeedAsync();
            var client = await LoginAsDemoUserAsync();

            var response = await client.GetAsync("/api/quizzes", Ct);
            var quizzes = await response.ReadAsync<List<QuizDto>>(HttpStatusCode.OK);

            Assert.Equal(Enum.GetValues<QuizKind>().Order(), quizzes.Select(q => q.Kind).Order());
            Assert.All(quizzes, q => Assert.True(q.QuestionCount > 0, $"Quiz \"{q.Title}\" has no questions."));
        }

        // The seeded data must follow the same rules as data created through the API.
        [Fact]
        public async Task Seed_CreatesQuestionsThatFollowApiRules()
        {
            await RunSeedAsync();
            var client = await LoginAsDemoUserAsync();
            var quizzes = await (await client.GetAsync("/api/quizzes", Ct)).ReadAsync<List<QuizDto>>(HttpStatusCode.OK);

            foreach (var quiz in quizzes)
            {
                var details = await (await client.GetAsync($"/api/quizzes/{quiz.Id}", Ct))
                    .ReadAsync<QuizDetailsDto>(HttpStatusCode.OK);

                Assert.Equal(Enumerable.Range(1, details.Questions.Count), details.Questions.Select(q => q.Order));

                foreach (var question in details.Questions)
                {
                    switch (quiz.Kind)
                    {
                        case QuizKind.OpenText:
                            Assert.Null(question.Options);
                            break;
                        case QuizKind.PollChoice:
                            Assert.InRange(question.Options!.Count, 2, 10);
                            Assert.All(question.Options, o => Assert.Null(o.IsCorrect));
                            break;
                        case QuizKind.QuizChoice:
                            Assert.InRange(question.Options!.Count, 2, 10);
                            Assert.Single(question.Options, o => o.IsCorrect == true);
                            break;
                    }
                }
            }
        }

        [Fact]
        public async Task Seed_Twice_DoesNotDuplicateData()
        {
            await RunSeedAsync();
            var before = await CountRowsAsync();

            await RunSeedAsync();
            var after = await CountRowsAsync();

            Assert.Equal(before, after);
            Assert.Equal(1, after.Users);
            Assert.Equal(3, after.Quizzes);
        }

        private async Task RunSeedAsync()
        {
            var exitCode = await Program.Main(["db", "seed", $"--ConnectionStrings:Default=Data Source={factory.DatabasePath}"]);

            Assert.Equal(0, exitCode);
        }

        private async Task<HttpClient> LoginAsDemoUserAsync()
        {
            var client = factory.CreateClient();

            var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("quizzer", "quiz123"), Ct);
            var auth = await response.ReadAsync<AuthResponse>(HttpStatusCode.OK);

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
            return client;
        }

        private async Task<RowCounts> CountRowsAsync()
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return new RowCounts(
                await db.Users.CountAsync(u => u.NormalizedUserName == "QUIZZER", Ct),
                await db.Quizzes.CountAsync(q => q.Owner.NormalizedUserName == "QUIZZER", Ct),
                await db.OpenQuestions.CountAsync(Ct) + await db.PollQuestions.CountAsync(Ct) + await db.QuizQuestions.CountAsync(Ct),
                await db.PollOptions.CountAsync(Ct) + await db.QuizOptions.CountAsync(Ct));
        }

        private record RowCounts(int Users, int Quizzes, int Questions, int Options);
    }
}
