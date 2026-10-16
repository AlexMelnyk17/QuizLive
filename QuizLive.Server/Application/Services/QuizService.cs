using QuizLive.Server.Application.DTO;
using QuizLive.Server.Application.Mappings;
using QuizLive.Server.Core.Interfaces;
using QuizLive.Server.Infrastructure.Repositories;

namespace QuizLive.Server.Application.Services
{
    public class QuizService(IQuizRepository repository) : IQuizService
    {
        public async Task<IReadOnlyList<ReadQuizListItemDto>> GetAllAsync(CancellationToken ct = default) =>
            await repository.GetListAsync(ct);

        public async Task<ReadQuizDetailsDto?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdAsync(id, ct);
            return quiz?.ToDetailsDto();
        }

        public async Task<ReadQuizDetailsDto> CreateAsync(CreateQuizDto dto, CancellationToken ct = default)
        {
            var quiz = dto.ToEntity();
            await repository.AddAsync(quiz, ct);
            return quiz.ToDetailsDto();
        }

        public async Task<ReadQuizDetailsDto?> UpdateAsync(int id, CreateQuizDto dto, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdForUpdateAsync(id, ct);
            if (quiz is null) return null;

            quiz.Title = dto.Title;
            quiz.Description = dto.Description;

            quiz.Questions.Clear();
            for (var i = 0; i < dto.Questions.Count; i++)
                quiz.Questions.Add(dto.Questions[i].ToEntity(i + 1));

            await repository.SaveChangesAsync(ct);
            return quiz.ToDetailsDto();
        }

        public async Task<DeleteQuizResult> DeleteAsync(int id, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdForUpdateAsync(id, ct);
            if (quiz is null) return DeleteQuizResult.NotFound;

            if (await repository.HasGameSessionsAsync(id, ct))
                return DeleteQuizResult.HasGameHistory;

            await repository.DeleteAsync(quiz, ct);
            return DeleteQuizResult.Deleted;
        }

    }

}
