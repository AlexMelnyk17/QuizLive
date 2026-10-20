using QuizLive.Server.Application.Quizzes;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IQuizService
    {
        Task<List<QuizDto>> GetMyQuizzesAsync();
        Task<QuizDto> GetByIdAsync(int id);
    }
}
