using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Application.Auth;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Auth
{
    public class AuthTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private const string InvalidCredentials = "Invalid user name or password.";
        private const int MaxFailedAttempts = 5;

        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Fact]
        public async Task GetMe_WithValidTokenForDeletedUser_Returns401()
        {
            var client = factory.CreateClient();
            var auth = await client.RegisterAsync();
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var user = await db.Users.SingleAsync(user => user.Id == auth.User.Id, Ct);
                db.Users.Remove(user);
                await db.SaveChangesAsync(Ct);
            }

            var response = await GetMeAsync(client, auth.Token);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Unauthorized);
            Assert.Equal("User no longer exists.", problem.Detail);
        }

        [Theory]
        [InlineData("bad#name")]
        [InlineData("bad name")]
        public async Task Register_WithIdentityInvalidUserName_ReturnsUserNameValidationError(string userName)
        {
            var response = await PostRegisterAsync(factory.CreateClient(), userName);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "userName");
        }

        [Fact]
        public async Task Register_WhenIdentityRejectsPassword_ReturnsPasswordValidationError()
        {
            using var stricterFactory = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
                services.PostConfigure<IdentityOptions>(options => options.Password.RequiredUniqueChars = 4)));
            var client = stricterFactory.CreateClient();

            var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(NewUserName(), "aaaaaa"), Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "password");
        }

        [Fact]
        public async Task Register_ReturnsTokenAndUser()
        {
            var userName = NewUserName();

            var auth = await factory.CreateClient().RegisterAsync(userName);

            Assert.False(string.IsNullOrEmpty(auth.Token));
            Assert.True(auth.ExpiresAtUtc > DateTime.UtcNow);
            Assert.Equal(userName, auth.User.UserName);
            Assert.False(string.IsNullOrEmpty(auth.User.Id));
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public async Task Register_WithTakenUserName_Returns409(bool differentCase)
        {
            var client = factory.CreateClient();
            var userName = NewUserName();
            await client.RegisterAsync(userName);

            var response = await PostRegisterAsync(client, differentCase ? userName.ToUpperInvariant() : userName);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal("User name is already taken.", problem.Detail);
        }

        [Fact]
        public async Task Register_WithShortPassword_Returns400()
        {
            var response = await factory.CreateClient().PostAsJsonAsync(
                "/api/auth/register", new RegisterRequest(NewUserName(), "12345"), Ct);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "password");
        }

        [Fact]
        public async Task Login_ReturnsTokenThatWorksForMe()
        {
            var client = factory.CreateClient();
            var registered = await client.RegisterAsync(NewUserName());

            var login = await PostLoginAsync(client, registered.User.UserName, ApiClientExtensions.Password);
            var auth = await login.ReadAsync<AuthResponse>(HttpStatusCode.OK);

            var me = await GetMeAsync(client, auth.Token);
            var user = await me.ReadAsync<UserDto>(HttpStatusCode.OK);
            Assert.Equal(registered.User, user);
        }

        [Fact]
        public async Task Login_WithUnknownUser_Returns401()
        {
            var response = await PostLoginAsync(factory.CreateClient(), NewUserName(), ApiClientExtensions.Password);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Unauthorized);
            Assert.Equal(InvalidCredentials, problem.Detail);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("not-a-jwt")]
        public async Task Me_WithoutValidToken_Returns401(string? token)
        {
            var response = await GetMeAsync(factory.CreateClient(), token);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Login_WithWrongPassword_Returns401WithRemainingAttempts()
        {
            var client = factory.CreateClient();
            var userName = (await client.RegisterAsync(NewUserName())).User.UserName;

            for (var failed = 1; failed < MaxFailedAttempts; failed++)
            {
                var response = await PostLoginAsync(client, userName, "wrong-password");

                var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Unauthorized);
                Assert.Equal(InvalidCredentials, problem.Detail);
                Assert.Equal(MaxFailedAttempts - failed, Extension(problem, "remainingAttempts").GetInt32());
            }
        }

        [Fact]
        public async Task Login_AfterMaxFailedAttempts_LocksAccount()
        {
            var client = factory.CreateClient();
            var userName = (await client.RegisterAsync(NewUserName())).User.UserName;

            for (var failed = 1; failed < MaxFailedAttempts; failed++)
            {
                await PostLoginAsync(client, userName, "wrong-password");
            }

            var lastFailure = await PostLoginAsync(client, userName, "wrong-password");
            var correctPassword = await PostLoginAsync(client, userName, ApiClientExtensions.Password);

            await AssertLockedOutAsync(lastFailure);
            await AssertLockedOutAsync(correctPassword);
        }

        private static async Task AssertLockedOutAsync(HttpResponseMessage response)
        {
            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Unauthorized);

            Assert.Equal("Account is temporarily locked. Try again later.", problem.Detail);
            Assert.True(Extension(problem, "lockoutEndUtc").GetDateTime() > DateTime.UtcNow);
        }

        private static JsonElement Extension(ProblemDetails problem, string key)
        {
            Assert.True(problem.Extensions.TryGetValue(key, out var value), $"Expected the \"{key}\" extension.");
            return Assert.IsType<JsonElement>(value);
        }

        private static string NewUserName() => $"u{Guid.NewGuid():N}";

        private static Task<HttpResponseMessage> PostRegisterAsync(HttpClient client, string userName) =>
            client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(userName, ApiClientExtensions.Password), Ct);

        private static Task<HttpResponseMessage> PostLoginAsync(HttpClient client, string userName, string password) =>
            client.PostAsJsonAsync("/api/auth/login", new LoginRequest(userName, password), Ct);

        private static Task<HttpResponseMessage> GetMeAsync(HttpClient client, string? token)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");

            if (token is not null)
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            return client.SendAsync(request, Ct);
        }
    }
}
