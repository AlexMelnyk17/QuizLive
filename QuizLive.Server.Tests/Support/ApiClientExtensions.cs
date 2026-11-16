using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using QuizLive.Server.Application.Auth;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Tests.Support
{
    public static class ApiClientExtensions
    {
        public const string Password = "secret1";

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static async Task<HttpClient> CreateAuthorizedClientAsync(this WebApplicationFactory<Program> factory)
        {
            var client = factory.CreateClient();
            var auth = await client.RegisterAsync();

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
            return client;
        }

        // The JWT of a client created by CreateAuthorizedClientAsync, e.g. to pass it to a hub.
        public static string BearerToken(this HttpClient client) =>
            client.DefaultRequestHeaders.Authorization?.Parameter
            ?? throw new InvalidOperationException("The client is not authorized.");

        public static async Task<AuthResponse> RegisterAsync(this HttpClient client, string? userName = null)
        {
            var request = new RegisterRequest(userName ?? $"u{Guid.NewGuid():N}", Password);

            var response = await client.PostAsJsonAsync("/api/auth/register", request, Ct);
            return await response.ReadAsync<AuthResponse>(HttpStatusCode.Created);
        }

        public static async Task<QuizDto> CreateQuizAsync(this HttpClient client, QuizKind kind, string title = "Test quiz")
        {
            var request = new CreateQuizRequest(title, null, kind);

            var response = await client.PostAsJsonAsync("/api/quizzes", request, Ct);
            return await response.ReadAsync<QuizDto>(HttpStatusCode.Created);
        }

        public static async Task<QuestionDto> AddQuestionAsync(this HttpClient client, int quizId, QuizKind kind)
        {
            var response = await client.PostAsJsonAsync($"/api/quizzes/{quizId}/questions", ValidQuestion(kind), Ct);
            return await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);
        }

        public static async Task<QuizDto> CreatePlayableQuizAsync(this HttpClient client, QuizKind kind)
        {
            var quiz = await client.CreateQuizAsync(kind);
            await client.AddQuestionAsync(quiz.Id, kind);
            return quiz;
        }

        public static async Task<GameDto> CreateGameAsync(this HttpClient client, int quizId)
        {
            var response = await client.PostAsJsonAsync("/api/games", new CreateGameRequest(quizId), Ct);
            return await response.ReadAsync<GameDto>(HttpStatusCode.Created);
        }

        public static async Task<JoinGameResponse> JoinAsync(this HttpClient client, string code, string nickname)
        {
            var response = await client.PostAsJsonAsync($"/api/games/code/{code}/players", new JoinGameRequest(nickname), Ct);
            return await response.ReadAsync<JoinGameResponse>(HttpStatusCode.Created);
        }

        public static QuestionRequest ValidQuestion(QuizKind kind) => kind switch
        {
            QuizKind.OpenText => new QuestionRequest("What is the capital of Ukraine?", 30, null, null, null),
            QuizKind.PollChoice => new QuestionRequest("Tea or coffee?", 30, null, null,
                [new OptionRequest("Tea", null), new OptionRequest("Coffee", null)]),
            QuizKind.QuizChoice => new QuestionRequest("What is 2 + 2?", 30, 100, null,
                [new OptionRequest("4", true), new OptionRequest("5", false)]),
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
        };

        public static async Task<T> ReadAsync<T>(this HttpResponseMessage response, HttpStatusCode expectedStatus)
        {
            if (response.StatusCode != expectedStatus)
            {
                var body = await response.Content.ReadAsStringAsync(Ct);
                var request = response.RequestMessage;

                Assert.Fail(
                    $"{request?.Method} {request?.RequestUri?.PathAndQuery}: expected {(int)expectedStatus}, " +
                    $"got {(int)response.StatusCode}. Body: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<T>(Ct);
            return result ?? throw new InvalidOperationException($"The response body is not a {typeof(T).Name}.");
        }
    }
}
