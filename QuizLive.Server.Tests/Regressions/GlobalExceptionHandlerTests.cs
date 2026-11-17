using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Infrastructure.ErrorHandling;

namespace QuizLive.Server.Tests.Regressions;

public class GlobalExceptionHandlerTests
{
    [Theory]
    [InlineData(400, "Validation failed")]
    [InlineData(401, "Unauthorized")]
    [InlineData(404, "Resource not found")]
    [InlineData(409, "Conflict")]
    [InlineData(500, "An unexpected error occurred")]
    public async Task Handler_ReturnsProblemDetailsWithoutLeakingUnexpectedErrors(int status, string title)
    {
        const string detail = "private diagnostic detail";
        Exception error = status switch
        {
            400 => new DomainValidationException(detail),
            401 => new UnauthorizedException(detail),
            404 => new NotFoundException(detail),
            409 => new ConflictException(detail),
            _ => new InvalidOperationException(detail)
        };
        using var services = new ServiceCollection().AddOptions().BuildServiceProvider();
        var context = new DefaultHttpContext { RequestServices = services };
        await using var body = new MemoryStream();
        context.Response.Body = body;
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);

        Assert.True(await handler.TryHandleAsync(context, error, TestContext.Current.CancellationToken));

        Assert.Equal(status, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
        body.Position = 0;
        using var json = await JsonDocument.ParseAsync(body, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(status, json.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(title, json.RootElement.GetProperty("title").GetString());
        if (status == 500)
            Assert.DoesNotContain(detail, json.RootElement.GetRawText());
        else
            Assert.Equal(detail, json.RootElement.GetProperty("detail").GetString());
    }
}
