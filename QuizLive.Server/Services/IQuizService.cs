using QuizLive.Server.Data.DTO;

namespace QuizLive.Server.Services
{
    public enum DeleteQuizResult
    {
        Deleted,
        NotFound,
        HasGameHistory
    }

    public interface IQuizService
    {
        Task<IReadOnlyList<ReadQuizListItemDto>> GetAllAsync(CancellationToken ct = default);
        Task<ReadQuizDetailsDto?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<ReadQuizDetailsDto> CreateAsync(CreateQuizDto dto, CancellationToken ct = default);
        Task<ReadQuizDetailsDto?> UpdateAsync(int id, CreateQuizDto dto, CancellationToken ct = default);
        Task<DeleteQuizResult> DeleteAsync(int id, CancellationToken ct = default);
    }
}
