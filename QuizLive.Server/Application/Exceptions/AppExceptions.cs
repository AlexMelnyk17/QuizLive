namespace QuizLive.Server.Application.Exceptions
{
    public class NotFoundException(string message) : Exception(message);

    public class ConflictException(string message) : Exception(message);

    public class UnauthorizedException(
				string message,
				IDictionary<string, object?>? extensions = null) : Exception(message)
		{
			public IDictionary<string, object?>? Extensions { get; } = extensions;
		}

    public class DomainValidationException(
        string message,
        IDictionary<string, string[]>? errors = null) : Exception(message)
    {
        // Помилки по полях (ключ - назва поля). Якщо задані, клієнт отримує ValidationProblemDetails.
        public IDictionary<string, string[]>? Errors { get; } = errors;
    }
}
