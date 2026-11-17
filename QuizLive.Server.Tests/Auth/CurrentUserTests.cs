using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QuizLive.Server.Infrastructure.Auth;

namespace QuizLive.Server.Tests.Auth;

public class CurrentUserTests
{
    [Fact]
    public void UserId_UsesNameIdentifierInsteadOfDisplayName()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, "user-123"),
                new Claim(ClaimTypes.Name, "quizzer")], "test"))
        };
        var currentUser = new CurrentUser(new HttpContextAccessor { HttpContext = context });

        Assert.Equal("user-123", currentUser.UserId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void UserId_RejectsMissingOrEmptyIdentifier(string? identifier)
    {
        var context = new DefaultHttpContext();
        if (identifier is not null)
            context.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, identifier)]));
        var currentUser = new CurrentUser(new HttpContextAccessor { HttpContext = context });

        Assert.Throws<InvalidOperationException>(() => currentUser.UserId);
    }

    [Fact]
    public void UserId_RejectsCallsOutsideHttpRequest()
    {
        var currentUser = new CurrentUser(new HttpContextAccessor());

        Assert.Throws<InvalidOperationException>(() => currentUser.UserId);
    }
}
