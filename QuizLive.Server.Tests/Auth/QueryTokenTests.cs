using System.Net;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Auth
{
    // The access_token query parameter exists for the hub only: tokens in a URL end up in logs.
    public class QueryTokenTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task TokenInQueryString_IsNotAcceptedOnRegularEndpoints()
        {
            var client = factory.CreateClient();
            var auth = await client.RegisterAsync();

            var response = await client.GetAsync($"/api/quizzes?access_token={auth.Token}", Ct);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task TokenInAuthorizationHeader_StillWorksOnRegularEndpoints()
        {
            var client = await factory.CreateAuthorizedClientAsync();

            var response = await client.GetAsync("/api/quizzes", Ct);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
