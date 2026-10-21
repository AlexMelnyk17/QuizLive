using QuizLive.Server.Application.Quizzes;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IQuizService
    {
        Task<List<QuizDto>> GetMyQuizzesAsync(bool? archived = null);
        Task<QuizDto> GetByIdAsync(int id);
        Task<QuizDto> CreateAsync(CreateQuizRequest request);
        Task<QuizDto> UpdateAsync(int id, UpdateQuizRequest request);
        Task SetArchivedAsync(int id, bool isArchived);
        Task DeleteAsync(int id);
    }
}
