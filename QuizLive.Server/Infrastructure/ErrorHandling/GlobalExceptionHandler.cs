using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using QuizLive.Server.Application.Exeptions;

namespace QuizLive.Server.Infrastructure.ErrorHandling
{
    public class GlobalExceptionHandler(
         ILogger<GlobalExceptionHandler> logger,
         IProblemDetailsService problemDetailsService) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
        {
            var (status, title) = exception switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
                ConflictException => (StatusCodes.Status409Conflict, "Conflict"),
                DomainValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
                UnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
                _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
            };

            if (status == StatusCodes.Status500InternalServerError)
            {
                logger.LogError(exception, "Unhandled exception");
            }

            httpContext.Response.StatusCode = status;

            // For 500 we never leak the exception message to the client.
            var detail = status == StatusCodes.Status500InternalServerError ? null : exception.Message;

            ProblemDetails problemDetails = exception is DomainValidationException { Errors: { } errors }
                ? new HttpValidationProblemDetails(errors)
                : new ProblemDetails();

            problemDetails.Status = status;
            problemDetails.Title = title;
            problemDetails.Detail = detail;

            return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = problemDetails
            });
        }
    }
}
