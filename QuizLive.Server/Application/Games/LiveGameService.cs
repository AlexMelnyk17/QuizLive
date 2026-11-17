using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Games;

public class LiveGameService(AppDbContext db, IGameNotifier notifier, TimeProvider clock)
{
    public async Task SubmitAsync(int gameId, int playerId, SubmitAnswerRequest? request)
    {
        if (request is null) throw new DomainValidationException("Answer is required.");

        // SQLite's non-deferred transaction takes the writer lock before reading the state. A close
        // either waits for this answer to commit, or wins first and the answer observes Results.
        await using var transaction = await db.Database.BeginTransactionAsync();
        var game = await db.GameSessionRecords.AsNoTracking()
            .Where(g => g.Id == gameId && g.EndedAtUtc == null && g.Players.Any(p => p.Id == playerId))
            .Select(g => new { g.Status, g.QuizId, g.Quiz.Kind, g.CurrentQuestionOrder,
                g.CurrentQuestionStartedAtUtc, g.CurrentQuestionEndsAtUtc }).SingleOrDefaultAsync()
            ?? throw new NotFoundException("Player game was not found.");
        var now = clock.GetUtcNow().UtcDateTime;
        if (game.Status != GameStatus.Question || game.CurrentQuestionOrder != request.QuestionNumber ||
            game.CurrentQuestionEndsAtUtc is { } ends && now >= ends)
            throw new ConflictException(GameMessages.QuestionNotOpen);

        var question = (await QuestionQueries.ForQuiz(db, game.QuizId, game.Kind).ToListAsync())
            .Single(q => q.Order == request.QuestionNumber);
        var elapsed = Math.Max(0, (now - game.CurrentQuestionStartedAtUtc!.Value).TotalMilliseconds);
        var points = 0;
        var previousPoints = 0;
        switch (game.Kind)
        {
            case QuizKind.OpenText:
                var text = request.Text?.Trim();
                if (request.OptionId is not null || string.IsNullOrEmpty(text) || text.Length > 200)
                    throw new DomainValidationException("An open answer must contain 1 to 200 characters and no option id.");
                var openAnswer = await db.OpenAnswers.SingleOrDefaultAsync(a => a.OpenQuestionId == question.Id && a.PlayerId == playerId);
                if (openAnswer is null)
                    db.OpenAnswers.Add(new OpenAnswer { OpenQuestionId = question.Id, PlayerId = playerId,
                        Text = text, AnsweredAtUtc = now });
                else if (openAnswer.Text != text)
                {
                    openAnswer.Text = text;
                    openAnswer.AnsweredAtUtc = now;
                }
                break;
            case QuizKind.PollChoice:
            case QuizKind.QuizChoice:
                if (request.Text is not null || request.OptionId is null)
                    throw new DomainValidationException("A choice answer requires an option id and no text.");
                var option = question.Options!.SingleOrDefault(o => o.Id == request.OptionId)
                    ?? throw new DomainValidationException("The option does not belong to the current question.");
                if (game.Kind == QuizKind.PollChoice)
                {
                    var pollAnswer = await db.PollAnswers.SingleOrDefaultAsync(a => a.PollQuestionId == question.Id && a.PlayerId == playerId);
                    if (pollAnswer is null)
                        db.PollAnswers.Add(new PollAnswer { PollQuestionId = question.Id, PlayerId = playerId,
                            PollOptionId = option.Id, AnsweredAtUtc = now });
                    else if (pollAnswer.PollOptionId != option.Id)
                    {
                        pollAnswer.PollOptionId = option.Id;
                        pollAnswer.AnsweredAtUtc = now;
                    }
                }
                else
                {
                    var quizAnswer = await db.QuizAnswers.SingleOrDefaultAsync(a => a.QuizQuestionId == question.Id && a.PlayerId == playerId);
                    previousPoints = quizAnswer?.Points ?? 0;
                    points = ScoreCalculator.Calculate(game.Kind, option.IsCorrect == true, question.BasePoints,
                        elapsed, (game.CurrentQuestionEndsAtUtc - game.CurrentQuestionStartedAtUtc)?.TotalMilliseconds);
                    if (quizAnswer is null)
                        db.QuizAnswers.Add(new QuizAnswer { QuizQuestionId = question.Id, PlayerId = playerId,
                            QuizOptionId = option.Id, IsCorrect = option.IsCorrect == true, Points = points,
                            ElapsedMs = (int)Math.Min(int.MaxValue, elapsed), AnsweredAtUtc = now });
                    else if (quizAnswer.QuizOptionId == option.Id)
                        points = previousPoints; // Retrying the same answer preserves its time and speed bonus.
                    else
                    {
                        quizAnswer.QuizOptionId = option.Id;
                        quizAnswer.IsCorrect = option.IsCorrect == true;
                        quizAnswer.Points = points;
                        quizAnswer.ElapsedMs = (int)Math.Min(int.MaxValue, elapsed);
                        quizAnswer.AnsweredAtUtc = now;
                    }
                }
                break;
        }
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            throw new ConflictException("You have already answered this question.");
        }
        var scoreDelta = points - previousPoints;
        await db.Players.Where(p => p.Id == playerId).ExecuteUpdateAsync(s => s.SetProperty(p => p.TotalScore, p => p.TotalScore + scoreDelta));
        var progress = await ProgressAsync(gameId, request.QuestionNumber);
        await transaction.CommitAsync();
        await notifier.AnswerProgressAsync(gameId, progress);
    }

    // Only the player's own answer is returned; correctness and scores stay private until results.
    public async Task<SubmitAnswerRequest?> CurrentAnswerAsync(int gameId, int playerId, int? number)
    {
        if (number is null) return null;
        return await db.OpenAnswers.AsNoTracking()
            .Where(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            .Select(a => new SubmitAnswerRequest(number.Value, null, a.Text)).SingleOrDefaultAsync()
            ?? await db.PollAnswers.AsNoTracking()
            .Where(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            .Select(a => new SubmitAnswerRequest(number.Value, a.PollOptionId, null)).SingleOrDefaultAsync()
            ?? await db.QuizAnswers.AsNoTracking()
            .Where(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            .Select(a => new SubmitAnswerRequest(number.Value, a.QuizOptionId, null)).SingleOrDefaultAsync();
    }

    public async Task<bool> HasAnsweredAsync(int gameId, int playerId, int? number)
    {
        if (number is null) return false;
        return await db.OpenAnswers.AnyAsync(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number) ||
            await db.PollAnswers.AnyAsync(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number) ||
            await db.QuizAnswers.AnyAsync(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number);
    }

    public async Task<AnswerProgressDto> ProgressAsync(int gameId, int number)
    {
        var count = await db.OpenAnswers.CountAsync(a => a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            + await db.PollAnswers.CountAsync(a => a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            + await db.QuizAnswers.CountAsync(a => a.Player.GameSessionRecordId == gameId && a.Question.Order == number);
        return new(number, count, await db.Players.CountAsync(p => p.GameSessionRecordId == gameId));
    }

    public async Task<LeaderboardDto> LeaderboardAsync(int gameId, bool final = false)
    {
        var players = await db.Players.AsNoTracking().Where(p => p.GameSessionRecordId == gameId)
            .OrderByDescending(p => p.TotalScore).ThenBy(p => p.JoinedAtUtc).ThenBy(p => p.Id)
            .Select(p => new { p.Id, p.Nickname, p.TotalScore }).ToListAsync();
        // Competition ranking: equal totals share a place, with deterministic ordering inside a tie.
        return new(players.Select(p => new LeaderboardEntryDto(p.Id, p.Nickname, p.TotalScore,
            1 + players.Count(other => other.TotalScore > p.TotalScore))).ToList(), final);
    }

    public async Task<HostQuestionResultsDto> HostResultsAsync(int gameId, int number)
    {
        var game = await db.GameSessionRecords.AsNoTracking().Where(g => g.Id == gameId)
            .Select(g => new { g.QuizId, g.Quiz.Kind }).SingleAsync();
        var question = (await QuestionQueries.ForQuiz(db, game.QuizId, game.Kind).ToListAsync()).Single(q => q.Order == number);
        var progress = await ProgressAsync(gameId, number);
        if (game.Kind == QuizKind.OpenText)
        {
            var rows = await db.OpenAnswers.Where(a => a.Player.GameSessionRecordId == gameId && a.OpenQuestionId == question.Id)
                .Select(a => new { a.Text, a.IsHidden }).ToListAsync();
            return new(number, progress.Answered, progress.Players, null,
                OpenTextAnswerGrouper.GroupForGame(rows.Select(a => (a.Text, a.IsHidden)).ToList()));
        }
        var votes = game.Kind == QuizKind.PollChoice
            ? await db.PollAnswers.Where(a => a.Player.GameSessionRecordId == gameId && a.PollQuestionId == question.Id).Select(a => a.PollOptionId).ToListAsync()
            : await db.QuizAnswers.Where(a => a.Player.GameSessionRecordId == gameId && a.QuizQuestionId == question.Id).Select(a => a.QuizOptionId).ToListAsync();
        return new(number, progress.Answered, progress.Players,
            question.Options!.Select(o => new OptionResultDto(o.Id, o.Text, votes.Count(id => id == o.Id), o.IsCorrect)).ToList(), null);
    }

    public async Task<PlayerQuestionResultsDto> PlayerResultsAsync(int gameId, int playerId, int number, LeaderboardDto leaderboard)
    {
        var answer = await db.QuizAnswers.AsNoTracking()
            .Where(a => a.PlayerId == playerId && a.Player.GameSessionRecordId == gameId && a.Question.Order == number)
            .Select(a => new { a.IsCorrect, a.Points }).SingleOrDefaultAsync();
        var row = leaderboard.Entries.Single(p => p.PlayerId == playerId);
        return new(number, await HasAnsweredAsync(gameId, playerId, number), answer?.IsCorrect, answer?.Points ?? 0, row.Total, row.Place);
    }

    public async Task PublishResultsAsync(int gameId, int number)
    {
        var leaderboard = await LeaderboardAsync(gameId);
        await notifier.HostResultsAsync(gameId, await HostResultsAsync(gameId, number));
        foreach (var player in leaderboard.Entries)
            await notifier.PlayerResultsAsync(gameId, player.PlayerId, await PlayerResultsAsync(gameId, player.PlayerId, number, leaderboard));
        await notifier.LeaderboardAsync(gameId, leaderboard);
    }
}
