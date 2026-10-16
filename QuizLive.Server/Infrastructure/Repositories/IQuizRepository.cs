using QuizLive.Server.Application.DTO;
using QuizLive.Server.Core.Entities;

namespace QuizLive.Server.Infrastructure.Repositories
{
    public interface IQuizRepository
    {
        Task<List<ReadQuizListItemDto>> GetListAsync(CancellationToken ct = default);

        // для читання: без відстеження змін, з питаннями
        Task<Quiz?> GetByIdAsync(int id, CancellationToken ct = default);

        // для оновлення/видалення: з відстеженням, з питаннями
        Task<Quiz?> GetByIdForUpdateAsync(int id, CancellationToken ct = default);

        Task<bool> HasGameSessionsAsync(int id, CancellationToken ct = default);

        Task AddAsync(Quiz quiz, CancellationToken ct = default);
        Task DeleteAsync(Quiz quiz, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
