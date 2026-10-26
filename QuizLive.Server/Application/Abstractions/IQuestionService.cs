using QuizLive.Server.Application.Common;
using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.Application.Abstractions
{
    public interface IQuestionService
    {
        Task<PagedResult<QuestionDto>> GetPageAsync(int quizId, PageQuery page);
        Task<QuestionDto> GetByIdAsync(int quizId, int questionId);
        Task<QuestionDto> CreateAsync(int quizId, CreateQuestionRequest request);
    }
}
