using QuizLive.Server.Data.DTO;
using QuizLive.Server.Mappings;


namespace QuizLive.Server.Services
{
    public class QuizService(IQuizRepository repository) : IQuizService
    {
        public async Task<IReadOnlyList<ReadQuizListItemDto>> GetAllAsync(CancellationToken ct = default) =>
            await repository.GetListAsync(ct);

        public async Task<ReadQuizDetailsDto> GetByIdAsync(int id, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Quiz {id} not found.");
            return quiz.ToDetailsDto();
        }

        public async Task<ReadQuizDetailsDto> CreateAsync(CreateQuizDto dto, CancellationToken ct = default)
        {
            var quiz = dto.ToEntity();
            await repository.AddAsync(quiz, ct);
            return quiz.ToDetailsDto();
        }

        public async Task<ReadQuizDetailsDto> UpdateAsync(int id, CreateQuizDto dto, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdForUpdateAsync(id, ct)
                ?? throw new NotFoundException($"Quiz {id} not found.");

            quiz.Title = dto.Title;
            quiz.Description = dto.Description;

            // PUT = повна заміна: старі питання видаляємо, нові додаємо з Order за позицією
            quiz.Questions.Clear();
            for (var i = 0; i < dto.Questions.Count; i++)
                quiz.Questions.Add(dto.Questions[i].ToEntity(i + 1));

            await repository.SaveChangesAsync(ct);
            return quiz.ToDetailsDto();
        }

        public async Task DeleteAsync(int id, CancellationToken ct = default)
        {
            var quiz = await repository.GetByIdForUpdateAsync(id, ct)
                ?? throw new NotFoundException($"Quiz {id} not found.");

            if (await repository.HasGameSessionsAsync(id, ct))
                throw new ConflictException("Quiz has game history and cannot be deleted.");

            await repository.DeleteAsync(quiz, ct);
        }
    }
}
