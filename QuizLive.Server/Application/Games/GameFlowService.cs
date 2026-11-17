using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Games
{
    // Every transition is compare-and-set: the UPDATE names the state the command expects, so a stale or
    // repeated command (for example from a second host tab) changes nothing and gets a conflict.
    // After a transition is saved, the service tells the connected clients; the commands are therefore
    // the single place that sends these events, whether they come from the hub or from REST.
    public class GameFlowService(AppDbContext db, IGameNotifier notifier, LiveGameService live, TimeProvider clock) : IGameFlowService
    {
        private sealed record FlowState(
            GameStatus Status,
            int QuizId,
            QuizKind Kind,
            int? CurrentQuestionOrder,
            int PlayerCount);

        public async Task<QuestionViews?> GetCurrentQuestionAsync(int gameId)
        {
            var game = await ActiveGame(gameId)
                .Where(g => g.Status == GameStatus.Question || g.Status == GameStatus.Results)
                .AsNoTracking()
                .Select(g => new
                {
                    g.QuizId,
                    g.Quiz.Kind,
                    g.CurrentQuestionOrder,
                    g.CurrentQuestionStartedAtUtc,
                    g.CurrentQuestionEndsAtUtc
                })
                .FirstOrDefaultAsync();

            if (game?.CurrentQuestionOrder is not { } order || game.CurrentQuestionStartedAtUtc is not { } startedAt)
            {
                return null;
            }

            var questions = await QuestionQueries.ForQuiz(db, game.QuizId, game.Kind).ToListAsync();
            var current = questions.FirstOrDefault(q => q.Order == order);

            return current is null
                ? null
                : LiveGameMappings.ToViews(current, questions.Count, startedAt, game.CurrentQuestionEndsAtUtc, clock.GetUtcNow().UtcDateTime);
        }

        public async Task<QuestionViews> StartAsync(int gameId, string hostUserId)
        {
            var game = await LoadActiveAsync(gameId, hostUserId);

            if (game.Status != GameStatus.Lobby)
            {
                throw new ConflictException(GameMessages.AlreadyStarted);
            }

            if (game.PlayerCount == 0)
            {
                throw new ConflictException(GameMessages.NoPlayers);
            }

            var questions = await LoadQuestionsAsync(game);
            var first = questions.FirstOrDefault()
                ?? throw new ConflictException(GameMessages.NoQuestions);

            var startedAt = clock.GetUtcNow().UtcDateTime;
            var endsAt = EndOf(first, startedAt);

            var changed = await ActiveGame(gameId)
                .Where(g => g.Status == GameStatus.Lobby)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(g => g.Status, GameStatus.Question)
                    .SetProperty(g => g.StartedAtUtc, startedAt)
                    .SetProperty(g => g.CurrentQuestionOrder, first.Order)
                    .SetProperty(g => g.CurrentQuestionStartedAtUtc, startedAt)
                    .SetProperty(g => g.CurrentQuestionEndsAtUtc, endsAt));

            if (changed == 0)
            {
                throw new ConflictException(GameMessages.AlreadyStarted);
            }

            var views = LiveGameMappings.ToViews(first, questions.Count, startedAt, endsAt, clock.GetUtcNow().UtcDateTime);
            await notifier.QuestionShownAsync(gameId, views);

            return views;
        }

        public async Task<int> ShowResultsAsync(int gameId, string hostUserId)
        {
            var game = await LoadActiveAsync(gameId, hostUserId);

            if (game.Status != GameStatus.Question)
            {
                throw new ConflictException(GameMessages.QuestionNotOpen);
            }

            var order = game.CurrentQuestionOrder!.Value;

            if (!await CloseQuestionAsync(gameId, order))
            {
                throw new ConflictException(GameMessages.QuestionNotOpen);
            }

            return order;
        }

        public async Task<NextQuestionResult> NextQuestionAsync(int gameId, string hostUserId)
        {
            var game = await LoadActiveAsync(gameId, hostUserId);

            if (game.Status != GameStatus.Results)
            {
                throw new ConflictException(GameMessages.ResultsNotShown);
            }

            var current = game.CurrentQuestionOrder!.Value;
            var questions = await LoadQuestionsAsync(game);

            // The first question after the current one, so a gap in the numbering would not matter.
            var next = questions.FirstOrDefault(q => q.Order > current);
            var now = clock.GetUtcNow().UtcDateTime;

            if (next is null)
            {
                var finished = await ActiveGame(gameId)
                    .Where(g => g.Status == GameStatus.Results && g.CurrentQuestionOrder == current)
                    .ExecuteUpdateAsync(set => set
                        .SetProperty(g => g.Status, GameStatus.Finished)
                        .SetProperty(g => g.EndedAtUtc, now));

                if (finished == 0)
                {
                    throw new ConflictException(GameMessages.ResultsNotShown);
                }

                await notifier.LeaderboardAsync(gameId, await live.LeaderboardAsync(gameId, final: true));
                await notifier.GameEndedAsync(gameId);

                return new NextQuestionResult(null);
            }

            var endsAt = EndOf(next, now);

            var changed = await ActiveGame(gameId)
                .Where(g => g.Status == GameStatus.Results && g.CurrentQuestionOrder == current)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(g => g.Status, GameStatus.Question)
                    .SetProperty(g => g.CurrentQuestionOrder, next.Order)
                    .SetProperty(g => g.CurrentQuestionStartedAtUtc, now)
                    .SetProperty(g => g.CurrentQuestionEndsAtUtc, endsAt));

            if (changed == 0)
            {
                throw new ConflictException(GameMessages.ResultsNotShown);
            }

            var views = LiveGameMappings.ToViews(next, questions.Count, now, endsAt, clock.GetUtcNow().UtcDateTime);
            await notifier.QuestionShownAsync(gameId, views);

            return new NextQuestionResult(views);
        }

        public async Task<bool> EndAsync(int gameId, string hostUserId)
        {
            var isHosts = await db.GameSessionRecords.AnyAsync(g => g.Id == gameId && g.HostUserId == hostUserId);

            if (!isHosts)
            {
                throw new NotFoundException(GameMessages.NotFound(gameId));
            }

            // Setting EndedAtUtc frees the join code and unfreezes the quiz. A game that has ended matches nothing.
            var changed = await ActiveGame(gameId)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(g => g.Status, GameStatus.Finished)
                    .SetProperty(g => g.EndedAtUtc, clock.GetUtcNow().UtcDateTime));

            if (changed == 0)
            {
                return false;
            }

            await notifier.LeaderboardAsync(gameId, await live.LeaderboardAsync(gameId, final: true));
            await notifier.GameEndedAsync(gameId);

            return true;
        }

        public async Task<QuestionTimingDto> AddTimeAsync(int gameId, string hostUserId, int seconds)
        {
            if (seconds is < 1 or > 300)
                throw new DomainValidationException("Additional time must be between 1 and 300 seconds.");
            await using var transaction = await db.Database.BeginTransactionAsync();
            await LoadActiveAsync(gameId, hostUserId);
            var game = await ActiveGame(gameId).AsNoTracking().SingleAsync();
            var now = clock.GetUtcNow().UtcDateTime;
            if (game.Status != GameStatus.Question || game.CurrentQuestionEndsAtUtc is not { } ends || now >= ends)
                throw new ConflictException(GameMessages.QuestionNotOpen);
            var extended = ends.AddSeconds(seconds);
            var changed = await ActiveGame(gameId)
                .Where(g => g.Status == GameStatus.Question && g.CurrentQuestionOrder == game.CurrentQuestionOrder
                    && g.CurrentQuestionEndsAtUtc == ends)
                .ExecuteUpdateAsync(s => s.SetProperty(g => g.CurrentQuestionEndsAtUtc, extended));
            if (changed == 0) throw new ConflictException(GameMessages.QuestionNotOpen);
            await transaction.CommitAsync();
            var timing = new QuestionTimingDto(game.CurrentQuestionStartedAtUtc!.Value, extended, now);
            await notifier.TimeAddedAsync(gameId, new QuestionTimeAddedDto(game.CurrentQuestionOrder!.Value, timing));
            return timing;
        }

        // The deadline is part of the CAS so an extension invalidates a timer that already woke up.
        public async Task<bool> CloseExpiredAsync(int gameId, int number, DateTime deadline)
        {
            var now = clock.GetUtcNow().UtcDateTime;
            if (now < deadline) return false;
            return await CloseQuestionAsync(gameId, number, deadline);
        }

        private async Task<bool> CloseQuestionAsync(int gameId, int number, DateTime? expectedDeadline = null)
        {
            var changed = await ActiveGame(gameId)
                .Where(g => g.Status == GameStatus.Question && g.CurrentQuestionOrder == number
                    && (expectedDeadline == null || g.CurrentQuestionEndsAtUtc == expectedDeadline))
                .ExecuteUpdateAsync(s => s.SetProperty(g => g.Status, GameStatus.Results));
            if (changed == 0) return false;
            await live.PublishResultsAsync(gameId, number);
            await notifier.QuestionClosedAsync(gameId, number);
            return true;
        }

        private IQueryable<GameSessionRecord> ActiveGame(int gameId) =>
            db.GameSessionRecords.Where(g => g.Id == gameId && g.EndedAtUtc == null);

        private async Task<FlowState> LoadActiveAsync(int gameId, string hostUserId) =>
            await ActiveGame(gameId)
                .Where(g => g.HostUserId == hostUserId)
                .AsNoTracking()
                .Select(g => new FlowState(g.Status, g.QuizId, g.Quiz.Kind, g.CurrentQuestionOrder, g.Players.Count))
                .FirstOrDefaultAsync()
            ?? throw new NotFoundException(GameMessages.NotFound(gameId));

        private Task<List<QuestionDto>> LoadQuestionsAsync(FlowState game) =>
            QuestionQueries.ForQuiz(db, game.QuizId, game.Kind).ToListAsync();

        private static DateTime? EndOf(QuestionDto question, DateTime startedAt) =>
            question.TimeLimitSeconds is { } seconds ? startedAt.AddSeconds(seconds) : null;
    }
}
