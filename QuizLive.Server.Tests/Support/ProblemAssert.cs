using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace QuizLive.Server.Tests.Support
{
    public static class ProblemAssert
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static async Task<ValidationProblemDetails> HasStatusAsync(HttpResponseMessage response, HttpStatusCode expectedStatus)
        {
            var body = await response.Content.ReadAsStringAsync(Ct);

            Assert.True(
                response.StatusCode == expectedStatus,
                $"Expected {(int)expectedStatus}, got {(int)response.StatusCode}. Body: {body}");
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

            return JsonSerializer.Deserialize<ValidationProblemDetails>(body, JsonOptions)
                ?? throw new InvalidOperationException("The response body is not a ProblemDetails.");
        }

        // Model validation reports keys as "UserName", the services as "userName".
        public static async Task<ValidationProblemDetails> HasErrorAsync(
            HttpResponseMessage response,
            HttpStatusCode expectedStatus,
            string errorKey)
        {
            var problem = await HasStatusAsync(response, expectedStatus);

            Assert.True(
                problem.Errors.Keys.Any(key => string.Equals(key, errorKey, StringComparison.OrdinalIgnoreCase)),
                $"Expected an error for \"{errorKey}\", got: {string.Join(", ", problem.Errors.Keys)}");

            return problem;
        }
    }
}
