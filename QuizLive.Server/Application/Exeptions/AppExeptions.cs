namespace QuizLive.Server.Application.Exeptions
{
    public class NotFoundException(string message) : Exception(message);

    public class ConflictException(string message) : Exception(message);

    public class DomainValidationException(string message) : Exception(message);
}
