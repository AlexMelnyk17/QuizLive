using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Common;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Questions
{
    public class QuestionService(AppDbContext db, ICurrentUser currentUser) : IQuestionService
    {
        // Максимум варіантів обмежує атрибут MaxLength у CreateQuestionRequest.
        private const int MinOptions = 2;

        public async Task<PagedResult<QuestionDto>> GetPageAsync(int quizId, PageQuery page)
        {
            var kind = await GetOwnQuizKindAsync(quizId);

            return await QueryQuestions(quizId, kind).ToPagedResultAsync(page);
        }

        public async Task<QuestionDto> GetByIdAsync(int quizId, int questionId)
        {
            var kind = await GetOwnQuizKindAsync(quizId);

            var question = await QueryQuestions(quizId, kind, questionId).FirstOrDefaultAsync();

            return question ?? throw new NotFoundException($"Question {questionId} was not found.");
        }

        public async Task<QuestionDto> CreateAsync(int quizId, CreateQuestionRequest request)
        {
            var kind = await GetOwnQuizKindAsync(quizId);

            // Під час гри учасники бачать питання за Order, тому квіз не змінюємо.
            var hasActiveGame = await db.GameSessionRecords
                .AnyAsync(g => g.QuizId == quizId && g.EndedAtUtc == null);

            if (hasActiveGame)
            {
                throw new ConflictException("Questions cannot be changed while the quiz has an active game.");
            }

            Validate(kind, request);

            var order = await GetNextOrderAsync(quizId, kind);
            var text = request.Text.Trim();
            var imageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
            var options = request.Options ?? [];

            int questionId;

            switch (kind)
            {
                case QuizKind.OpenText:
                    var openQuestion = new OpenQuestion
                    {
                        QuizId = quizId,
                        Text = text,
                        Order = order,
                        TimeLimitSeconds = request.TimeLimitSeconds,
                        ImageUrl = imageUrl
                    };

                    db.OpenQuestions.Add(openQuestion);
                    await SaveQuestionAsync();
                    questionId = openQuestion.Id;
                    break;

                case QuizKind.PollChoice:
                    var pollQuestion = new PollQuestion
                    {
                        QuizId = quizId,
                        Text = text,
                        Order = order,
                        TimeLimitSeconds = request.TimeLimitSeconds,
                        ImageUrl = imageUrl,
                        Options = options
                            .Select((o, i) => new PollOption { Text = o.Text.Trim(), Order = i + 1 })
                            .ToList()
                    };

                    db.PollQuestions.Add(pollQuestion);
                    await SaveQuestionAsync();
                    questionId = pollQuestion.Id;
                    break;

                case QuizKind.QuizChoice:
                    var quizQuestion = new QuizQuestion
                    {
                        QuizId = quizId,
                        Text = text,
                        Order = order,
                        TimeLimitSeconds = request.TimeLimitSeconds,
                        BasePoints = request.BasePoints,
                        ImageUrl = imageUrl,
                        Options = options
                            .Select((o, i) => new QuizOption
                            {
                                Text = o.Text.Trim(),
                                IsCorrect = o.IsCorrect == true,
                                Order = i + 1
                            })
                            .ToList()
                    };

                    db.QuizQuestions.Add(quizQuestion);
                    await SaveQuestionAsync();
                    questionId = quizQuestion.Id;
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }

            return await GetByIdAsync(quizId, questionId);
        }

        private async Task<QuizKind> GetOwnQuizKindAsync(int quizId)
        {
            var userId = currentUser.UserId;

            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == quizId && q.OwnerId == userId)
                .Select(q => new { q.Kind })
                .FirstOrDefaultAsync();

            return quiz?.Kind ?? throw new NotFoundException($"Quiz {quizId} was not found.");
        }

        // Фільтр по questionId стоїть до Select: після проєкції в record EF не перекладе q.Id у SQL.
        private IQueryable<QuestionDto> QueryQuestions(int quizId, QuizKind kind, int? questionId = null)
        {
            return kind switch
            {
                QuizKind.OpenText => db.OpenQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.OpenToDto),

                QuizKind.PollChoice => db.PollQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.PollToDto),

                QuizKind.QuizChoice => db.QuizQuestions
                    .AsNoTracking()
                    .Where(q => q.QuizId == quizId && (questionId == null || q.Id == questionId))
                    .OrderBy(q => q.Order)
                    .Select(QuestionMappings.QuizToDto),

                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }

        private async Task<int> GetNextOrderAsync(int quizId, QuizKind kind)
        {
            // int? — щоб MaxAsync повернув null для квізу без питань, а не кинув виняток.
            var maxOrder = kind switch
            {
                QuizKind.OpenText => await db.OpenQuestions
                    .Where(q => q.QuizId == quizId)
                    .MaxAsync(q => (int?)q.Order),

                QuizKind.PollChoice => await db.PollQuestions
                    .Where(q => q.QuizId == quizId)
                    .MaxAsync(q => (int?)q.Order),

                QuizKind.QuizChoice => await db.QuizQuestions
                    .Where(q => q.QuizId == quizId)
                    .MaxAsync(q => (int?)q.Order),

                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };

            return (maxOrder ?? 0) + 1;
        }

        private async Task SaveQuestionAsync()
        {
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Два одночасні запити отримали однаковий Order і впали на унікальному індексі QuizId + Order.
                throw new ConflictException("The quiz was changed by another request. Please try again.");
            }
        }

        private static void Validate(QuizKind kind, CreateQuestionRequest request)
        {
            var errors = new Dictionary<string, List<string>>();
            var options = request.Options ?? [];

            void AddError(string field, string message)
            {
                if (!errors.TryGetValue(field, out var messages))
                {
                    errors[field] = messages = [];
                }

                messages.Add(message);
            }

            if (kind != QuizKind.QuizChoice && request.BasePoints is not null)
            {
                AddError("basePoints", "Points are only used in quiz choice questions.");
            }

            switch (kind)
            {
                case QuizKind.OpenText:
                    if (options.Count > 0)
                    {
                        AddError("options", "Open text questions have no options.");
                    }
                    break;

                case QuizKind.PollChoice:
                    if (options.Count < MinOptions)
                    {
                        AddError("options", $"At least {MinOptions} options are required.");
                    }

                    for (var i = 0; i < options.Count; i++)
                    {
                        if (options[i].IsCorrect is not null)
                        {
                            AddError($"options[{i}].isCorrect", "Poll options have no correct answer.");
                        }
                    }
                    break;

                case QuizKind.QuizChoice:
                    if (options.Count < MinOptions)
                    {
                        AddError("options", $"At least {MinOptions} options are required.");
                    }

                    for (var i = 0; i < options.Count; i++)
                    {
                        if (options[i].IsCorrect is null)
                        {
                            AddError($"options[{i}].isCorrect", "Specify whether the option is correct.");
                        }
                    }

                    if (options.Count(o => o.IsCorrect == true) != 1)
                    {
                        AddError("options", "Exactly one option must be correct.");
                    }
                    break;
            }

            if (errors.Count > 0)
            {
                throw new DomainValidationException(
                    "Question validation failed.",
                    errors.ToDictionary(e => e.Key, e => e.Value.ToArray()));
            }
        }
    }
}
