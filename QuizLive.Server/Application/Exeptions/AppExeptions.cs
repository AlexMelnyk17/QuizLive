namespace QuizLive.Server.Application.Exeptions
{
    public class NotFoundException(string message) : Exception(message);

    public class ConflictException(string message) : Exception(message);

    public class UnauthorizedException(string message) : Exception(message);

    public class DomainValidationException(
        string message,
        IDictionary<string, string[]>? errors = null) : Exception(message)
    {
        // Помилки по полях (ключ - назва поля). Якщо задані, клієнт отримує ValidationProblemDetails.
        public IDictionary<string, string[]>? Errors { get; } = errors;
    }
}
