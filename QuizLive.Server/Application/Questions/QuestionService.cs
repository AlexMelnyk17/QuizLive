using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.Questions;
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
            var kind = await GetOwnQuizKindAsync(quizId, forEdit: true);

            Validate(kind, request);

            var options = request.Options ?? [];

            var questionId = kind switch
            {
                QuizKind.OpenText => await AddQuestionAsync(
                    new OpenQuestion { QuizId = quizId },
                    request),

                QuizKind.PollChoice => await AddQuestionAsync(
                    new PollQuestion { QuizId = quizId, Options = ToPollOptions(options) },
                    request),

                QuizKind.QuizChoice => await AddQuestionAsync(
                    new QuizQuestion { QuizId = quizId, BasePoints = request.BasePoints, Options = ToQuizOptions(options) },
                    request),

                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };

            return await GetByIdAsync(quizId, questionId);
        }

        public async Task<QuestionDto> UpdateAsync(int quizId, int questionId, QuestionRequest request)
        {
            var kind = await GetOwnQuizKindAsync(quizId, forEdit: true);

            Validate(kind, request);

            var options = request.Options ?? [];

            await using var transaction = await db.Database.BeginTransactionAsync();

            switch (kind)
            {
                case QuizKind.OpenText:
                    var openQuestion = await FindEditableQuestionAsync(db.OpenQuestions, quizId, questionId);

                    ApplyCommonFields(openQuestion, request);
                    await SaveQuestionAsync();
                    break;

                case QuizKind.PollChoice:
                    var pollQuestion = await FindEditableQuestionAsync(db.PollQuestions.Include(q => q.Options), quizId, questionId);

                    ApplyCommonFields(pollQuestion, request);
                    await ReplaceOptionsAsync(pollQuestion.Options, ToPollOptions(options));
                    break;

                case QuizKind.QuizChoice:
                    var quizQuestion = await FindEditableQuestionAsync(db.QuizQuestions.Include(q => q.Options), quizId, questionId);

                    ApplyCommonFields(quizQuestion, request);
                    quizQuestion.BasePoints = request.BasePoints;
                    await ReplaceOptionsAsync(quizQuestion.Options, ToQuizOptions(options));
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(kind), kind, null);
            }

            await transaction.CommitAsync();

            return await GetByIdAsync(quizId, questionId);
        }

        public async Task DeleteAsync(int quizId, int questionId)
        {
            var kind = await GetOwnQuizKindAsync(quizId, forEdit: true);

            await using var transaction = await db.Database.BeginTransactionAsync();

            await (kind switch
            {
                QuizKind.OpenText => DeleteQuestionAsync<OpenQuestion>(quizId, questionId),
                QuizKind.PollChoice => DeleteQuestionAsync<PollQuestion>(quizId, questionId),
                QuizKind.QuizChoice => DeleteQuestionAsync<QuizQuestion>(quizId, questionId),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            });

            await transaction.CommitAsync();
        }

        public async Task<List<QuestionDto>> ReorderAsync(int quizId, ReorderQuestionsRequest request)
        {
            var kind = await GetOwnQuizKindAsync(quizId, forEdit: true);

            await using var transaction = await db.Database.BeginTransactionAsync();

            await (kind switch
            {
                QuizKind.OpenText => ReorderQuestionsAsync<OpenQuestion>(quizId, request.QuestionIds),
                QuizKind.PollChoice => ReorderQuestionsAsync<PollQuestion>(quizId, request.QuestionIds),
                QuizKind.QuizChoice => ReorderQuestionsAsync<QuizQuestion>(quizId, request.QuestionIds),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            });

            await transaction.CommitAsync();

            return await QuestionQueries.ForQuiz(db, quizId, kind).ToListAsync();
        }

        // Takes an already found question, so answers are only checked for a question of the requested quiz.
        private async Task EnsureNoAnswersAsync(Question question)
        {
            var hasAnswers = question switch
            {
                OpenQuestion => await db.OpenAnswers.AnyAsync(a => a.OpenQuestionId == question.Id),
                PollQuestion => await db.PollAnswers.AnyAsync(a => a.PollQuestionId == question.Id),
                QuizQuestion => await db.QuizAnswers.AnyAsync(a => a.QuizQuestionId == question.Id),
                _ => throw new ArgumentOutOfRangeException(nameof(question), question.GetType().Name, null)
            };

            if (hasAnswers)
            {
                throw new ConflictException(QuestionMessages.HasAnswers);
            }
        }

        private async Task<int> AddQuestionAsync<T>(T question, QuestionRequest request) where T : Question
        {
            ApplyCommonFields(question, request);
            question.Order = await GetNextOrderAsync<T>(question.QuizId);

            db.Set<T>().Add(question);
            await SaveQuestionAsync();

            return question.Id;
        }

        private async Task<T> FindEditableQuestionAsync<T>(IQueryable<T> questions, int quizId, int questionId)
            where T : Question
        {
            var question = await questions.FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId)
                ?? throw QuestionNotFound(questionId);

            await EnsureNoAnswersAsync(question);

            return question;
        }

        private static void ApplyCommonFields(Question question, QuestionRequest request)
        {
            question.Text = request.Text.Trim();
            question.TimeLimitSeconds = request.TimeLimitSeconds;
            question.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        }

        // Old options are removed in a separate save so new ones don't hit the (QuestionId, Order) index.
        private async Task ReplaceOptionsAsync<T>(List<T> options, List<T> newOptions)
        {
            options.Clear();
            await SaveQuestionAsync();

            options.AddRange(newOptions);
            await SaveQuestionAsync();
        }

        private async Task DeleteQuestionAsync<T>(int quizId, int questionId) where T : Question
        {
            var questions = await db.Set<T>()
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .ToListAsync();

            var question = questions.FirstOrDefault(q => q.Id == questionId)
                ?? throw QuestionNotFound(questionId);

            await EnsureNoAnswersAsync(question);

            db.Set<T>().Remove(question);
            questions.Remove(question);
            await ApplyOrderAsync(questions);
        }

        private async Task ReorderQuestionsAsync<T>(int quizId, List<int> questionIds) where T : Question
        {
            var questions = await db.Set<T>().Where(q => q.QuizId == quizId).ToListAsync();

            await ApplyOrderAsync(SortByIds(questions, questionIds));
        }

        // SQLite checks the unique (QuizId, Order) index per row, so orders go through temporary negative values first.
        private async Task ApplyOrderAsync<T>(List<T> questions) where T : Question
        {
            for (var i = 0; i < questions.Count; i++)
            {
                questions[i].Order = -(i + 1);
            }

            await SaveQuestionAsync();

            for (var i = 0; i < questions.Count; i++)
            {
                questions[i].Order = i + 1;
            }

            await SaveQuestionAsync();
        }

        private static List<T> SortByIds<T>(List<T> questions, List<int> questionIds) where T : Question
        {
            var byId = questions.ToDictionary(q => q.Id);

            var isComplete = questionIds.Count == byId.Count
                && questionIds.Distinct().Count() == questionIds.Count
                && questionIds.All(byId.ContainsKey);

            if (!isComplete)
            {
                throw new DomainValidationException(
                    QuestionMessages.OrderValidationFailed,
                    new Dictionary<string, string[]>
                    {
                        ["questionIds"] = [QuestionMessages.OrderMustListAll]
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
            new(QuestionMessages.NotFound(questionId));

        private async Task<QuizKind> GetOwnQuizKindAsync(int quizId, bool forEdit = false)
        {
            var userId = currentUser.UserId;

            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == quizId && q.OwnerId == userId)
                .Select(q => new { q.Kind, q.IsArchived })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException(QuizMessages.NotFound(quizId));

            if (forEdit)
            {
                QuizGuards.EnsureNotArchived(quiz.IsArchived);
                await QuizGuards.EnsureNoActiveGameAsync(db, quizId);
            }

            return quiz.Kind;
        }

        private async Task<int> GetNextOrderAsync<T>(int quizId) where T : Question
        {
            // int? — щоб MaxAsync повернув null для квізу без питань, а не кинув виняток.
            var maxOrder = await db.Set<T>()
                .Where(q => q.QuizId == quizId)
                .MaxAsync(q => (int?)q.Order);

            return (maxOrder ?? 0) + 1;
        }

        private async Task SaveQuestionAsync()
        {
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // Concurrent requests collided on a unique Order index.
                throw new ConflictException(QuizMessages.ChangedConcurrently);
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
                AddError("basePoints", QuestionMessages.PointsOnlyInQuizChoice);
            }

            if (!string.IsNullOrWhiteSpace(request.ImageUrl) && !IsSafeImageUrl(request.ImageUrl.Trim()))
            {
                AddError("imageUrl", QuestionMessages.ImageUrlInvalid);
            }

            // Model validation checks option fields but not null items, so they are rejected here.
            var hasNullOption = false;

            for (var i = 0; i < options.Count; i++)
            {
                if (options[i] is null)
                {
                    AddError($"options[{i}]", QuestionMessages.OptionRequired);
                    hasNullOption = true;
                }
            }

            switch (kind)
            {
                case QuizKind.OpenText:
                    if (options.Count > 0)
                    {
                        AddError("options", QuestionMessages.OpenTextHasNoOptions);
                    }
                    break;

                case QuizKind.PollChoice:
                    if (options.Count < MinOptions)
                    {
                        AddError("options", QuestionMessages.MinOptions(MinOptions));
                    }

                    if (hasNullOption)
                    {
                        break;
                    }

                    for (var i = 0; i < options.Count; i++)
                    {
                        if (options[i].IsCorrect is not null)
                        {
                            AddError($"options[{i}].isCorrect", QuestionMessages.PollHasNoCorrectOption);
                        }
                    }
                    break;

                case QuizKind.QuizChoice:
                    if (options.Count < MinOptions)
                    {
                        AddError("options", QuestionMessages.MinOptions(MinOptions));
                    }

                    if (hasNullOption)
                    {
                        break;
                    }

                    for (var i = 0; i < options.Count; i++)
                    {
                        if (options[i].IsCorrect is null)
                        {
                            AddError($"options[{i}].isCorrect", QuestionMessages.IsCorrectRequired);
                        }
                    }

                    if (options.Count(o => o.IsCorrect == true) != 1)
                    {
                        AddError("options", QuestionMessages.ExactlyOneCorrect);
                    }
                    break;
            }

            if (errors.Count > 0)
            {
                throw new DomainValidationException(
                    QuestionMessages.ValidationFailed,
                    errors.ToDictionary(e => e.Key, e => e.Value.ToArray()));
            }
        }

        // The URL is rendered as <img src>, so only absolute http(s) links are allowed:
        // this rejects javascript:, data:, vbscript:, file: and relative paths.
        private static bool IsSafeImageUrl(string url) =>
            Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && !string.IsNullOrEmpty(uri.Host);
    }
}
