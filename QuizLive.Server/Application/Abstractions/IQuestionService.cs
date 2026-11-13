using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IQuestionService
    {
        Task<List<QuestionDto>> GetAllAsync(int quizId);
        Task<QuestionDto> GetByIdAsync(int quizId, int questionId);
        Task<QuestionDto> CreateAsync(int quizId, QuestionRequest request);
        Task<QuestionDto> UpdateAsync(int quizId, int questionId, QuestionRequest request);
        Task DeleteAsync(int quizId, int questionId);
        Task<List<QuestionDto>> ReorderAsync(int quizId, ReorderQuestionsRequest request);
    }
}
