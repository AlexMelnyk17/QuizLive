using System.Net;
using System.Net.Http.Json;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Quizzes
{
    public class QuizzesTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static TheoryData<string> InvalidTitles => new() { "", "   ", new string('a', 201) };

        [Fact]
        public async Task Create_ReturnsQuizWithLocation()
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsJsonAsync(
                "/api/quizzes", new CreateQuizRequest("  History  ", "   ", QuizKind.PollChoice), Ct);
            var quiz = await response.ReadAsync<QuizDto>(HttpStatusCode.Created);

            Assert.Equal("History", quiz.Title);
            Assert.Null(quiz.Description);
            Assert.Equal(QuizKind.PollChoice, quiz.Kind);
            Assert.False(quiz.IsArchived);
            Assert.Equal(0, quiz.QuestionCount);
            Assert.Equal($"/api/quizzes/{quiz.Id}", response.Headers.Location?.AbsolutePath);
        }

        [Fact]
        public async Task GetById_ReturnsQuizWithQuestions()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.QuizChoice, "Math");
            var question = await client.AddQuestionAsync(quiz.Id, QuizKind.QuizChoice);

            var details = await GetQuizAsync(client, quiz.Id);

            Assert.Equal("Math", details.Title);
            Assert.Equal(QuizKind.QuizChoice, details.Kind);
            Assert.Equal(question.Id, Assert.Single(details.Questions).Id);
        }

        // Regression for #33: the list endpoint returned 500.
        [Fact]
        public async Task GetAll_ReturnsOwnQuizzesNewestFirst()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var other = await factory.CreateAuthorizedClientAsync();
            var older = await client.CreatePlayableQuizAsync(QuizKind.OpenText);
            var newer = await client.CreateQuizAsync(QuizKind.PollChoice);
            await other.CreateQuizAsync(QuizKind.OpenText);

            var quizzes = await GetQuizzesAsync(client);

            Assert.Equal(new[] { newer.Id, older.Id }, quizzes.Select(q => q.Id));
            Assert.Equal(new[] { 0, 1 }, quizzes.Select(q => q.QuestionCount));
        }

        [Theory]
        [InlineData(null)]
        [InlineData(true)]
        [InlineData(false)]
        public async Task GetAll_FilteredByArchived_ReturnsMatchingQuizzes(bool? archived)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var active = await client.CreateQuizAsync(QuizKind.OpenText);
            var archivedQuiz = await client.CreateQuizAsync(QuizKind.OpenText);
            await PostAsync(client, $"/api/quizzes/{archivedQuiz.Id}/archive");

            var quizzes = await GetQuizzesAsync(client, archived is null ? "" : $"?archived={archived}");

            int[] expected = archived switch
            {
                null => [archivedQuiz.Id, active.Id],
                true => [archivedQuiz.Id],
                false => [active.Id]
            };
            Assert.Equal(expected, quizzes.Select(q => q.Id));
        }

        [Fact]
        public async Task Update_ChangesTitleAndDescription()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.QuizChoice, "Old title");

            var response = await client.PutAsJsonAsync(
                $"/api/quizzes/{quiz.Id}", new UpdateQuizRequest("  New title  ", "  About  "), Ct);
            var updated = await response.ReadAsync<QuizDto>(HttpStatusCode.OK);

            Assert.Equal("New title", updated.Title);
            Assert.Equal("About", updated.Description);
            Assert.Equal(QuizKind.QuizChoice, updated.Kind);

            var details = await GetQuizAsync(client, quiz.Id);
            Assert.Equal("New title", details.Title);
        }

        [Fact]
        public async Task ArchiveAndUnarchive_ChangeStateAndAreIdempotent()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.OpenText);
            var url = $"/api/quizzes/{quiz.Id}";

            await PostAsync(client, $"{url}/archive");
            await PostAsync(client, $"{url}/archive");
            Assert.True((await GetQuizAsync(client, quiz.Id)).IsArchived);

            await PostAsync(client, $"{url}/unarchive");
            await PostAsync(client, $"{url}/unarchive");
            Assert.False((await GetQuizAsync(client, quiz.Id)).IsArchived);
        }

        [Theory]
        [InlineData("GET", "")]
        [InlineData("PUT", "")]
        [InlineData("DELETE", "")]
        [InlineData("POST", "/archive")]
        [InlineData("POST", "/unarchive")]
        public async Task AnotherUsersQuiz_Returns404(string method, string path)
        {
            var owner = await factory.CreateAuthorizedClientAsync();
            var stranger = await factory.CreateAuthorizedClientAsync();
            var quiz = await owner.CreateQuizAsync(QuizKind.OpenText, "Owner's quiz");
            var request = new HttpRequestMessage(new HttpMethod(method), $"/api/quizzes/{quiz.Id}{path}");

            if (method == "PUT")
            {
                request.Content = JsonContent.Create(new UpdateQuizRequest("Stolen", null));
            }

            var response = await stranger.SendAsync(request, Ct);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal(QuizMessages.NotFound(quiz.Id), problem.Detail);

            var unchanged = await GetQuizAsync(owner, quiz.Id);
            Assert.Equal("Owner's quiz", unchanged.Title);
            Assert.False(unchanged.IsArchived);
        }

        [Theory]
        [MemberData(nameof(InvalidTitles))]
        public async Task Create_WithInvalidTitle_Returns400(string title)
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsJsonAsync(
                "/api/quizzes", new CreateQuizRequest(title, null, QuizKind.OpenText), Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "title");
        }

        [Theory]
        [MemberData(nameof(InvalidTitles))]
        public async Task Update_WithInvalidTitle_Returns400(string title)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.OpenText);

            var response = await client.PutAsJsonAsync($"/api/quizzes/{quiz.Id}", new UpdateQuizRequest(title, null), Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "title");
        }

        [Fact]
        public async Task Create_WithUnknownKind_Returns400()
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.PostAsJsonAsync("/api/quizzes", new { title = "Quiz", kind = 99 }, Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "kind");
        }

        [Fact]
        public async Task Update_ArchivedQuiz_Returns409()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.OpenText);
            await PostAsync(client, $"/api/quizzes/{quiz.Id}/archive");

            var response = await client.PutAsJsonAsync($"/api/quizzes/{quiz.Id}", new UpdateQuizRequest("New", null), Ct);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.IsArchived, problem.Detail);
        }

        [Fact]
        public async Task Update_QuizWithActiveGame_Returns409()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            await client.CreateGameAsync(quiz.Id);

            var response = await client.PutAsJsonAsync($"/api/quizzes/{quiz.Id}", new UpdateQuizRequest("New", null), Ct);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.HasActiveGame, problem.Detail);
        }

        private static async Task<QuizDetailsDto> GetQuizAsync(HttpClient client, int quizId)
        {
            var response = await client.GetAsync($"/api/quizzes/{quizId}", Ct);
            return await response.ReadAsync<QuizDetailsDto>(HttpStatusCode.OK);
        }

        private static async Task<List<QuizDto>> GetQuizzesAsync(HttpClient client, string query = "")
        {
            var response = await client.GetAsync($"/api/quizzes{query}", Ct);
            return await response.ReadAsync<List<QuizDto>>(HttpStatusCode.OK);
        }

        private static async Task PostAsync(HttpClient client, string url)
        {
            var response = await client.PostAsync(url, null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
    }
}
