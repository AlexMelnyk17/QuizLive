using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
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
        // The maximum is limited by MaxLength on QuestionRequest.Options.
        private const int MinOptions = 2;

        public async Task<List<QuestionDto>> GetAllAsync(int quizId)
        {
            var kind = await GetOwnQuizKindAsync(quizId);

            return await QuestionQueries.ForQuiz(db, quizId, kind).ToListAsync();
        }

        public async Task<QuestionDto> GetByIdAsync(int quizId, int questionId)
        {
            var kind = await GetOwnQuizKindAsync(quizId);

            var question = await QuestionQueries.ForQuiz(db, quizId, kind, questionId).FirstOrDefaultAsync();

            return question ?? throw QuestionNotFound(questionId);
        }

        public async Task<QuestionDto> CreateAsync(int quizId, QuestionRequest request)
        {
            var kind = await GetEditableQuizKindAsync(quizId);

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
                        Options = ToPollOptions(options)
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
                        Options = ToQuizOptions(options)
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

        public async Task<QuestionDto> UpdateAsync(int quizId, int questionId, QuestionRequest request)
        {
            var kind = await GetEditableQuizKindAsync(quizId);

            Validate(kind, request);
            await EnsureNoAnswersAsync(kind, questionId);

            var text = request.Text.Trim();
            var imageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
            var options = request.Options ?? [];

            await using var transaction = await db.Database.BeginTransactionAsync();

            switch (kind)
            {
                case QuizKind.OpenText:
                    var openQuestion = await db.OpenQuestions
                        .FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId)
                        ?? throw QuestionNotFound(questionId);

                    openQuestion.Text = text;
                    openQuestion.TimeLimitSeconds = request.TimeLimitSeconds;
                    openQuestion.ImageUrl = imageUrl;
                    await SaveQuestionAsync();
                    break;

                case QuizKind.PollChoice:
                    var pollQuestion = await db.PollQuestions
                        .Include(q => q.Options)
                        .FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId)
                        ?? throw QuestionNotFound(questionId);

                    pollQuestion.Text = text;
                    pollQuestion.TimeLimitSeconds = request.TimeLimitSeconds;
                    pollQuestion.ImageUrl = imageUrl;

                    // Old options are removed in a separate save so new ones don't hit the (QuestionId, Order) index.
                    pollQuestion.Options.Clear();
                    await SaveQuestionAsync();

                    pollQuestion.Options.AddRange(ToPollOptions(options));
                    await SaveQuestionAsync();
                    break;

                case QuizKind.QuizChoice:
                    var quizQuestion = await db.QuizQuestions
                        .Include(q => q.Options)
                        .FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId)
                        ?? throw QuestionNotFound(questionId);

                    quizQuestion.Text = text;
                    quizQuestion.TimeLimitSeconds = request.TimeLimitSeconds;
                    quizQuestion.BasePoints = request.BasePoints;
                    quizQuestion.ImageUrl = imageUrl;

                    quizQuestion.Options.Clear();
                    await SaveQuestionAsync();

                    quizQuestion.Options.AddRange(ToQuizOptions(options));
                    await SaveQuestionAsync();
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }

            await transaction.CommitAsync();

            return await GetByIdAsync(quizId, questionId);
        }

        public async Task DeleteAsync(int quizId, int questionId)
        {
            var kind = await GetEditableQuizKindAsync(quizId);

            await EnsureNoAnswersAsync(kind, questionId);

            await using var transaction = await db.Database.BeginTransactionAsync();

            switch (kind)
            {
                case QuizKind.OpenText:
                    var openQuestions = await db.OpenQuestions
                        .Where(q => q.QuizId == quizId)
                        .OrderBy(q => q.Order)
                        .ToListAsync();

                    var openQuestion = openQuestions.FirstOrDefault(q => q.Id == questionId)
                        ?? throw QuestionNotFound(questionId);

                    db.OpenQuestions.Remove(openQuestion);
                    openQuestions.Remove(openQuestion);
                    await ApplyOrderAsync(openQuestions, (q, order) => q.Order = order);
                    break;

                case QuizKind.PollChoice:
                    var pollQuestions = await db.PollQuestions
                        .Where(q => q.QuizId == quizId)
                        .OrderBy(q => q.Order)
                        .ToListAsync();

                    var pollQuestion = pollQuestions.FirstOrDefault(q => q.Id == questionId)
                        ?? throw QuestionNotFound(questionId);

                    db.PollQuestions.Remove(pollQuestion);
                    pollQuestions.Remove(pollQuestion);
                    await ApplyOrderAsync(pollQuestions, (q, order) => q.Order = order);
                    break;

                case QuizKind.QuizChoice:
                    var quizQuestions = await db.QuizQuestions
                        .Where(q => q.QuizId == quizId)
                        .OrderBy(q => q.Order)
                        .ToListAsync();

                    var quizQuestion = quizQuestions.FirstOrDefault(q => q.Id == questionId)
                        ?? throw QuestionNotFound(questionId);

                    db.QuizQuestions.Remove(quizQuestion);
                    quizQuestions.Remove(quizQuestion);
                    await ApplyOrderAsync(quizQuestions, (q, order) => q.Order = order);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }

            await transaction.CommitAsync();
        }

        public async Task<List<QuestionDto>> ReorderAsync(int quizId, ReorderQuestionsRequest request)
        {
            var kind = await GetEditableQuizKindAsync(quizId);

            await using var transaction = await db.Database.BeginTransactionAsync();

            switch (kind)
            {
                case QuizKind.OpenText:
                    var openQuestions = await db.OpenQuestions.Where(q => q.QuizId == quizId).ToListAsync();
                    await ApplyOrderAsync(
                        SortByIds(openQuestions, q => q.Id, request.QuestionIds),
                        (q, order) => q.Order = order);
                    break;

                case QuizKind.PollChoice:
                    var pollQuestions = await db.PollQuestions.Where(q => q.QuizId == quizId).ToListAsync();
                    await ApplyOrderAsync(
                        SortByIds(pollQuestions, q => q.Id, request.QuestionIds),
                        (q, order) => q.Order = order);
                    break;

                case QuizKind.QuizChoice:
                    var quizQuestions = await db.QuizQuestions.Where(q => q.QuizId == quizId).ToListAsync();
                    await ApplyOrderAsync(
                        SortByIds(quizQuestions, q => q.Id, request.QuestionIds),
                        (q, order) => q.Order = order);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }

            await transaction.CommitAsync();

            return await QuestionQueries.ForQuiz(db, quizId, kind).ToListAsync();
        }

        private async Task<QuizKind> GetEditableQuizKindAsync(int quizId)
        {
            var userId = currentUser.UserId;

            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == quizId && q.OwnerId == userId)
                .Select(q => new
                {
                    q.Kind,
                    q.IsArchived,
                    HasActiveGame = q.Games.Any(g => g.EndedAtUtc == null)
                })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException($"Quiz {quizId} was not found.");

            if (quiz.IsArchived)
            {
                throw new ConflictException("Questions of an archived quiz cannot be changed.");
            }

            if (quiz.HasActiveGame)
            {
                throw new ConflictException("Questions cannot be changed while the quiz has an active game.");
            }

            return quiz.Kind;
        }

        private async Task EnsureNoAnswersAsync(QuizKind kind, int questionId)
        {
            var hasAnswers = kind switch
            {
                QuizKind.OpenText => await db.OpenAnswers.AnyAsync(a => a.OpenQuestionId == questionId),
                QuizKind.PollChoice => await db.PollAnswers.AnyAsync(a => a.PollQuestionId == questionId),
                QuizKind.QuizChoice => await db.QuizAnswers.AnyAsync(a => a.QuizQuestionId == questionId),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };

            if (hasAnswers)
            {
                throw new ConflictException("The question already has answers from played games and cannot be changed.");
            }
        }

        // SQLite checks the unique (QuizId, Order) index per row, so orders go through temporary negative values first.
        private async Task ApplyOrderAsync<T>(List<T> questions, Action<T, int> setOrder)
        {
            for (var i = 0; i < questions.Count; i++)
            {
                setOrder(questions[i], -(i + 1));
            }

            await SaveQuestionAsync();

            for (var i = 0; i < questions.Count; i++)
            {
                setOrder(questions[i], i + 1);
            }

            await SaveQuestionAsync();
        }

        private static List<T> SortByIds<T>(List<T> questions, Func<T, int> getId, List<int> questionIds)
        {
            var byId = questions.ToDictionary(getId);

            var isComplete = questionIds.Count == byId.Count
                && questionIds.Distinct().Count() == questionIds.Count
                && questionIds.All(byId.ContainsKey);

            if (!isComplete)
            {
                throw new DomainValidationException(
                    "Question order validation failed.",
                    new Dictionary<string, string[]>
                    {
                        ["questionIds"] = ["Every question of the quiz must be listed exactly once."]
                    });
            }

            return questionIds.Select(id => byId[id]).ToList();
        }

        private static List<PollOption> ToPollOptions(List<OptionRequest> options) =>
            options
                .Select((o, i) => new PollOption { Text = o.Text.Trim(), Order = i + 1 })
                .ToList();

        private static List<QuizOption> ToQuizOptions(List<OptionRequest> options) =>
            options
                .Select((o, i) => new QuizOption { Text = o.Text.Trim(), IsCorrect = o.IsCorrect == true, Order = i + 1 })
                .ToList();

        private static NotFoundException QuestionNotFound(int questionId) =>
            new($"Question {questionId} was not found.");

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

        private static void Validate(QuizKind kind, QuestionRequest request)
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
