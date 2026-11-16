using Microsoft.AspNetCore.SignalR;
using QuizLive.Server.Application.Exceptions;

namespace QuizLive.Server.Infrastructure.ErrorHandling
{
    // The hub counterpart of GlobalExceptionHandler. SignalR sends the client only the message
    // of a HubException, so domain exceptions are passed on as one and anything else is hidden.
    public class HubExceptionFilter(ILogger<HubExceptionFilter> logger) : IHubFilter
    {
        public async ValueTask<object?> InvokeMethodAsync(
            HubInvocationContext invocationContext,
            Func<HubInvocationContext, ValueTask<object?>> next)
        {
            try
            {
                return await next(invocationContext);
            }
            catch (HubException)
            {
                throw;
            }
            catch (Exception ex) when (ex is NotFoundException
                or ConflictException
                or DomainValidationException
                or UnauthorizedException)
            {
                throw new HubException(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception in hub method {Method}", invocationContext.HubMethodName);
                throw new HubException("An unexpected error occurred");
            }
        }
    }
}
