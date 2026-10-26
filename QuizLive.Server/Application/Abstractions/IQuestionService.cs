using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IQuestionService
    {
        Task<List<QuestionDto>> GetAllAsync(int quizId);
        Task<QuestionDto> GetByIdAsync(int quizId, int questionId);
        Task<QuestionDto> CreateAsync(int quizId, CreateQuestionRequest request);
    }
}
