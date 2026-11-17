using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Stats
{
    public partial class StatsService
    {
        public async Task<QuizPlayStatsDto> GetQuizStatsAsync(int quizId)
        {
            var userId = currentUser.UserId;
            var quiz = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.Id == quizId && q.OwnerId == userId)
                .Select(q => new { q.Id, q.Kind, q.Title })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException(QuizMessages.NotFound(quizId));

            var gamesQuery = db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.QuizId == quizId && g.HostUserId == userId);

            var totalGames = await gamesQuery.CountAsync();
            var finishedGames = await gamesQuery
                .Where(g => g.EndedAtUtc != null)
                .OrderByDescending(g => g.CreatedAtUtc)
                .Select(g => new FinishedGameRow(
                    g.Id,
                    g.CreatedAtUtc,
                    g.EndedAtUtc!.Value))
                .ToListAsync();

            var finishedIds = finishedGames.Select(g => g.Id).ToList();
            var allGameIds = await gamesQuery.Select(g => g.Id).ToListAsync();
            var lastPlayed = totalGames == 0
                ? null
                : await gamesQuery.MaxAsync(g => (DateTime?)g.CreatedAtUtc);
            var averageDuration = ComputeAverageDurationSeconds(finishedGames);

            var gameStats = new QuizPlayGameStatsDto(
                totalGames,
                finishedGames.Count,
                lastPlayed,
                averageDuration);

            var playerStats = await BuildQuizPlayerStatsAsync(allGameIds, totalGames);
            var activity = await BuildQuizActivityStatsAsync(quizId, userId);
            var possibleAnswers = await CountPlayerJoinsAsync(finishedIds);
            var runs = await BuildQuizRunsAsync(quiz.Kind, finishedGames);

            List<QuizChoiceQuestionStatsDto>? quizChoiceQuestions = null;
            List<PollQuestionStatsDto>? pollQuestions = null;
            List<OpenQuestionStatsDto>? openQuestions = null;
            var questionCount = 0;

            switch (quiz.Kind)
            {
                case QuizKind.QuizChoice:
                    quizChoiceQuestions = await BuildQuizChoiceQuestionsForQuizAsync(
                        quizId,
                        finishedIds,
                        possibleAnswers);
                    questionCount = quizChoiceQuestions.Count;
                    break;
                case QuizKind.PollChoice:
                    pollQuestions = await BuildPollQuestionsForQuizAsync(
                        quizId,
                        finishedIds,
                        possibleAnswers);
                    questionCount = pollQuestions.Count;
                    break;
                case QuizKind.OpenText:
                    openQuestions = await BuildOpenQuestionsForQuizAsync(
                        quizId,
                        finishedIds,
                        possibleAnswers);
                    questionCount = openQuestions.Count;
                    break;
            }

            return new QuizPlayStatsDto(
                quiz.Id,
                quiz.Title,
                quiz.Kind,
                questionCount,
                gameStats,
                playerStats,
                activity,
                runs,
                quizChoiceQuestions,
                pollQuestions,
                openQuestions);
        }

        public async Task<GamePlayStatsDto> GetGameStatsAsync(int gameId)
        {
            var userId = currentUser.UserId;

            var game = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.Id == gameId && g.HostUserId == userId)
                .Select(g => new
                {
                    g.Id,
                    g.QuizId,
                    QuizTitle = g.Quiz.Title,
                    Kind = g.Quiz.Kind,
                    g.CreatedAtUtc,
                    g.EndedAtUtc,
                })
                .FirstOrDefaultAsync()
                ?? throw new NotFoundException($"Game {gameId} was not found.");

            if (game.EndedAtUtc is null)
            {
                throw new ConflictException(StatsMessages.GameNotFinished);
            }

            var ended = game.EndedAtUtc.Value;
            var duration = RoundToOneDecimal((decimal)(ended - game.CreatedAtUtc).TotalSeconds);
            var finishedIds = new List<int> { game.Id };
            var possibleAnswers = await CountPlayerJoinsAsync(finishedIds);

            var players = await BuildGamePlayersAsync(game.Id, game.Kind);
            var playerCount = players.Count;

            List<QuizChoiceQuestionStatsDto>? quizChoiceQuestions = null;
            List<PollQuestionStatsDto>? pollQuestions = null;
            List<OpenQuestionStatsDto>? openQuestions = null;

            switch (game.Kind)
            {
                case QuizKind.QuizChoice:
                    quizChoiceQuestions = await BuildQuizChoiceQuestionsForQuizAsync(
                        game.QuizId,
                        finishedIds,
                        possibleAnswers);
                    break;
                case QuizKind.PollChoice:
                    pollQuestions = await BuildPollQuestionsForQuizAsync(
                        game.QuizId,
                        finishedIds,
                        possibleAnswers);
                    break;
                case QuizKind.OpenText:
                    openQuestions = await BuildOpenQuestionsForGameAsync(
                        game.QuizId,
                        game.Id,
                        possibleAnswers);
                    break;
            }

            return new GamePlayStatsDto(
                game.Id,
                game.QuizId,
                game.QuizTitle,
                game.Kind,
                game.CreatedAtUtc,
                ended,
                duration,
                playerCount,
                players,
                quizChoiceQuestions,
                pollQuestions,
                openQuestions);
        }

        private async Task<PlayerStatsDto> BuildQuizPlayerStatsAsync(
            IReadOnlyList<int> gameIds,
            int gameTotal)
        {
            if (gameIds.Count == 0)
            {
                return new PlayerStatsDto(0, 0m, 0);
            }

            var totalJoins = await db.Players
                .AsNoTracking()
                .Where(p => gameIds.Contains(p.GameSessionRecordId))
                .CountAsync();

            var playersPerGame = await db.Players
                .AsNoTracking()
                .Where(p => gameIds.Contains(p.GameSessionRecordId))
                .GroupBy(p => p.GameSessionRecordId)
                .Select(g => g.Count())
                .ToListAsync();

            var maxInOneGame = playersPerGame.Count == 0 ? 0 : playersPerGame.Max();
            var average = gameTotal == 0
                ? 0m
                : RoundToOneDecimal((decimal)totalJoins / gameTotal);

            return new PlayerStatsDto(totalJoins, average, maxInOneGame);
        }

        private async Task<ActivityStatsDto> BuildQuizActivityStatsAsync(int quizId, string userId)
        {
            var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);
            var windowStart = todayUtc.AddDays(-(ActivityDays - 1));
            var rangeStartUtc = windowStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var createdTimestamps = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.HostUserId == userId && g.QuizId == quizId && g.CreatedAtUtc >= rangeStartUtc)
                .Select(g => g.CreatedAtUtc)
                .ToListAsync();

            return BuildActivityFromTimestamps(createdTimestamps, todayUtc, windowStart);
        }

        private ActivityStatsDto BuildActivityFromTimestamps(
            List<DateTime> createdTimestamps,
            DateOnly todayUtc,
            DateOnly windowStart)
        {
            var bucket = new Dictionary<DateOnly, int>();
            foreach (var created in createdTimestamps)
            {
                var day = DateOnly.FromDateTime(created);
                bucket.TryGetValue(day, out var count);
                bucket[day] = count + 1;
            }

            var gamesPerDay = new List<GamesPerDayDto>(ActivityDays);
            for (var offset = 0; offset < ActivityDays; offset++)
            {
                var date = windowStart.AddDays(offset);
                bucket.TryGetValue(date, out var count);
                gamesPerDay.Add(new GamesPerDayDto(date, count));
            }

            var last7Start = todayUtc.AddDays(-6).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var gamesLast7Days = createdTimestamps.Count(t => t >= last7Start);
            var gamesLast30Days = createdTimestamps.Count;

            return new ActivityStatsDto(gamesLast7Days, gamesLast30Days, gamesPerDay);
        }

        private static decimal? ComputeAverageDurationSeconds(IReadOnlyList<FinishedGameRow> finishedGames)
        {
            if (finishedGames.Count == 0)
            {
                return null;
            }

            var totalSeconds = finishedGames.Sum(g => (g.EndedAtUtc - g.CreatedAtUtc).TotalSeconds);
            return RoundToOneDecimal((decimal)(totalSeconds / finishedGames.Count));
        }

        private async Task<int> CountPlayerJoinsAsync(IReadOnlyList<int> finishedGameIds)
        {
            if (finishedGameIds.Count == 0)
            {
                return 0;
            }

            return await db.Players
                .AsNoTracking()
                .Where(p => finishedGameIds.Contains(p.GameSessionRecordId))
                .CountAsync();
        }

        private async Task<List<QuizRunSummaryDto>> BuildQuizRunsAsync(
            QuizKind kind,
            IReadOnlyList<FinishedGameRow> finishedGames)
        {
            if (finishedGames.Count == 0)
            {
                return [];
            }

            var gameIds = finishedGames.Select(g => g.Id).ToList();

            var playerCounts = await db.Players
                .AsNoTracking()
                .Where(p => gameIds.Contains(p.GameSessionRecordId))
                .GroupBy(p => p.GameSessionRecordId)
                .Select(g => new { GameId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.GameId, x => x.Count);

            Dictionary<int, QuizRunMetrics>? quizMetrics = null;
            Dictionary<int, int>? answerCounts = null;

            if (kind == QuizKind.QuizChoice)
            {
                quizMetrics = await LoadQuizChoiceRunMetricsAsync(gameIds);
            }
            else
            {
                answerCounts = await LoadAnswerCountsForRunsAsync(kind, gameIds);
            }

            var runs = new List<QuizRunSummaryDto>(finishedGames.Count);
            foreach (var game in finishedGames)
            {
                playerCounts.TryGetValue(game.Id, out var playerCount);
                var duration = RoundToOneDecimal((decimal)(game.EndedAtUtc - game.CreatedAtUtc).TotalSeconds);

                decimal? averagePoints = null;
                decimal? correctPercent = null;
                int? answerCount = null;

                if (kind == QuizKind.QuizChoice && quizMetrics?.TryGetValue(game.Id, out var metrics) == true)
                {
                    averagePoints = metrics.AveragePoints;
                    correctPercent = metrics.CorrectPercent;
                }
                else if (answerCounts?.TryGetValue(game.Id, out var count) == true)
                {
                    answerCount = count;
                }

                runs.Add(new QuizRunSummaryDto(
                    game.Id,
                    game.CreatedAtUtc,
                    game.EndedAtUtc,
                    duration,
                    playerCount,
                    averagePoints,
                    correctPercent,
                    answerCount));
            }

            return runs;
        }

        private async Task<Dictionary<int, QuizRunMetrics>> LoadQuizChoiceRunMetricsAsync(List<int> gameIds)
        {
            var rows = await db.QuizAnswers
                .AsNoTracking()
                .Where(a => gameIds.Contains(a.Player.GameSessionRecordId))
                .Select(a => new
                {
                    a.Player.GameSessionRecordId,
                    a.IsCorrect,
                    a.Points,
                })
                .ToListAsync();

            return rows
                .GroupBy(r => r.GameSessionRecordId)
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var total = g.Count();
                        var correct = g.Count(x => x.IsCorrect);
                        var points = g.Where(x => x.Points is not null).Select(x => x.Points!.Value).ToList();
                        var averagePoints = points.Count == 0
                            ? (decimal?)null
                            : RoundToOneDecimal((decimal)points.Average());
                        var correctPercent = total == 0
                            ? 0m
                            : RoundToOneDecimal(100m * correct / total);
                        return new QuizRunMetrics(averagePoints, correctPercent);
                    });
        }

        private async Task<Dictionary<int, int>> LoadAnswerCountsForRunsAsync(QuizKind kind, List<int> gameIds)
        {
            return kind switch
            {
                QuizKind.OpenText => await db.OpenAnswers
                    .AsNoTracking()
                    .Where(a => gameIds.Contains(a.Player.GameSessionRecordId))
                    .GroupBy(a => a.Player.GameSessionRecordId)
                    .Select(g => new { GameId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.GameId, x => x.Count),
                QuizKind.PollChoice => await db.PollAnswers
                    .AsNoTracking()
                    .Where(a => gameIds.Contains(a.Player.GameSessionRecordId))
                    .GroupBy(a => a.Player.GameSessionRecordId)
                    .Select(g => new { GameId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.GameId, x => x.Count),
                _ => [],
            };
        }

        private async Task<List<QuizChoiceQuestionStatsDto>> BuildQuizChoiceQuestionsForQuizAsync(
            int quizId,
            IReadOnlyList<int> finishedGameIds,
            int possibleAnswers)
        {
            var questions = await db.QuizQuestions
                .AsNoTracking()
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .Select(q => new QuestionRow(q.Id, q.Order, q.Text))
                .ToListAsync();

            var options = await db.QuizOptions
                .AsNoTracking()
                .Where(o => o.Question.QuizId == quizId)
                .OrderBy(o => o.QuizQuestionId)
                .ThenBy(o => o.Order)
                .Select(o => new QuizOptionRow(o.Id, o.QuizQuestionId, o.Order, o.Text, o.IsCorrect))
                .ToListAsync();

            if (finishedGameIds.Count == 0)
            {
                return questions.Select(q => ToEmptyQuizChoiceQuestion(q, options, possibleAnswers)).ToList();
            }

            var answers = await db.QuizAnswers
                .AsNoTracking()
                .Where(a => finishedGameIds.Contains(a.Player.GameSessionRecordId))
                .Where(a => a.Question.QuizId == quizId)
                .Select(a => new QuizAnswerRow(
                    a.QuizQuestionId,
                    a.QuizOptionId,
                    a.PlayerId,
                    a.IsCorrect,
                    a.ElapsedMs,
                    a.Points))
                .ToListAsync();

            return questions
                .Select(q => BuildQuizChoiceQuestion(q, options, answers, possibleAnswers))
                .ToList();
        }

        private async Task<List<PollQuestionStatsDto>> BuildPollQuestionsForQuizAsync(
            int quizId,
            IReadOnlyList<int> finishedGameIds,
            int possibleAnswers)
        {
            var questions = await db.PollQuestions
                .AsNoTracking()
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .Select(q => new QuestionRow(q.Id, q.Order, q.Text))
                .ToListAsync();

            var options = await db.PollOptions
                .AsNoTracking()
                .Where(o => o.Question.QuizId == quizId)
                .OrderBy(o => o.PollQuestionId)
                .ThenBy(o => o.Order)
                .Select(o => new PollOptionRow(o.Id, o.PollQuestionId, o.Order, o.Text))
                .ToListAsync();

            if (finishedGameIds.Count == 0)
            {
                return questions.Select(q => ToEmptyPollQuestion(q, options, possibleAnswers)).ToList();
            }

            var answers = await db.PollAnswers
                .AsNoTracking()
                .Where(a => finishedGameIds.Contains(a.Player.GameSessionRecordId))
                .Where(a => a.Question.QuizId == quizId)
                .Select(a => new PollAnswerRow(a.PollQuestionId, a.PollOptionId, a.PlayerId))
                .ToListAsync();

            return questions
                .Select(q => BuildPollQuestion(q, options, answers, possibleAnswers))
                .ToList();
        }

        private async Task<List<OpenQuestionStatsDto>> BuildOpenQuestionsForQuizAsync(
            int quizId,
            IReadOnlyList<int> finishedGameIds,
            int possibleAnswers)
        {
            var questions = await db.OpenQuestions
                .AsNoTracking()
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .Select(q => new QuestionRow(q.Id, q.Order, q.Text))
                .ToListAsync();

            if (finishedGameIds.Count == 0)
            {
                return questions
                    .Select(q => new OpenQuestionStatsDto(
                        q.Id,
                        q.Order,
                        q.Text,
                        0,
                        possibleAnswers,
                        0,
                        0,
                        [],
                        0,
                        null))
                    .ToList();
            }

            var answers = await db.OpenAnswers
                .AsNoTracking()
                .Where(a => finishedGameIds.Contains(a.Player.GameSessionRecordId))
                .Where(a => a.Question.QuizId == quizId)
                .Select(a => new OpenAnswerRow(a.OpenQuestionId, a.PlayerId, a.Text, a.IsHidden))
                .ToListAsync();

            return questions
                .Select(q => BuildOpenQuestionForQuiz(q, answers, possibleAnswers))
                .ToList();
        }

        private async Task<List<OpenQuestionStatsDto>> BuildOpenQuestionsForGameAsync(
            int quizId,
            int gameId,
            int possibleAnswers)
        {
            var questions = await db.OpenQuestions
                .AsNoTracking()
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .Select(q => new QuestionRow(q.Id, q.Order, q.Text))
                .ToListAsync();

            var answerRows = await db.OpenAnswers
                .AsNoTracking()
                .Where(a => a.Player.GameSessionRecordId == gameId)
                .Where(a => a.Question.QuizId == quizId)
                .Select(a => new OpenAnswerDetailRow(
                    a.OpenQuestionId,
                    a.PlayerId,
                    a.Player.Nickname,
                    a.Text,
                    a.IsHidden,
                    a.AnsweredAtUtc))
                .ToListAsync();

            return questions
                .Select(q => BuildOpenQuestionForGame(q, answerRows, possibleAnswers))
                .ToList();
        }

        private async Task<List<GamePlayerStatsDto>> BuildGamePlayersAsync(int gameId, QuizKind kind)
        {
            var players = await db.Players
                .AsNoTracking()
                .Where(p => p.GameSessionRecordId == gameId)
                .OrderBy(p => p.JoinedAtUtc)
                .Select(p => new { p.Id, p.Nickname, p.JoinedAtUtc })
                .ToListAsync();

            if (players.Count == 0)
            {
                return [];
            }

            if (kind != QuizKind.QuizChoice)
            {
                var answerCounts = await LoadPerPlayerAnswerCountsAsync(kind, gameId);
                return players
                    .Select(p => new GamePlayerStatsDto(
                        p.Id,
                        p.Nickname,
                        p.JoinedAtUtc,
                        answerCounts.GetValueOrDefault(p.Id, 0),
                        null,
                        null))
                    .ToList();
            }

            var quizStats = await db.QuizAnswers
                .AsNoTracking()
                .Where(a => a.Player.GameSessionRecordId == gameId)
                .GroupBy(a => a.PlayerId)
                .Select(g => new
                {
                    PlayerId = g.Key,
                    Count = g.Count(),
                    Correct = g.Count(x => x.IsCorrect),
                    Points = g.Sum(x => x.Points ?? 0),
                })
                .ToDictionaryAsync(x => x.PlayerId);

            return players
                .Select(p =>
                {
                    quizStats.TryGetValue(p.Id, out var stats);
                    return new GamePlayerStatsDto(
                        p.Id,
                        p.Nickname,
                        p.JoinedAtUtc,
                        stats?.Count ?? 0,
                        stats?.Correct ?? 0,
                        stats?.Points ?? 0);
                })
                .ToList();
        }

        private async Task<Dictionary<int, int>> LoadPerPlayerAnswerCountsAsync(QuizKind kind, int gameId)
        {
            return kind switch
            {
                QuizKind.OpenText => await db.OpenAnswers
                    .AsNoTracking()
                    .Where(a => a.Player.GameSessionRecordId == gameId)
                    .GroupBy(a => a.PlayerId)
                    .Select(g => new { PlayerId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PlayerId, x => x.Count),
                QuizKind.PollChoice => await db.PollAnswers
                    .AsNoTracking()
                    .Where(a => a.Player.GameSessionRecordId == gameId)
                    .GroupBy(a => a.PlayerId)
                    .Select(g => new { PlayerId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PlayerId, x => x.Count),
                _ => [],
            };
        }

        private static QuizChoiceQuestionStatsDto BuildQuizChoiceQuestion(
            QuestionRow question,
            IReadOnlyList<QuizOptionRow> allOptions,
            IReadOnlyList<QuizAnswerRow> allAnswers,
            int possibleAnswers)
        {
            var questionAnswers = allAnswers.Where(a => a.QuestionId == question.Id).ToList();
            var questionOptions = allOptions.Where(o => o.QuestionId == question.Id).OrderBy(o => o.Order).ToList();
            var optionCounts = questionAnswers
                .GroupBy(a => a.OptionId)
                .ToDictionary(g => g.Key, g => g.Count());

            var correctCount = questionAnswers.Count(a => a.IsCorrect);
            var totalAnswers = questionAnswers.Count;
            var correctPercent = totalAnswers == 0
                ? 0m
                : RoundToOneDecimal(100m * correctCount / totalAnswers);

            var elapsed = questionAnswers.Where(a => a.ElapsedMs is not null).Select(a => a.ElapsedMs!.Value).ToList();
            decimal? averageElapsed = elapsed.Count == 0
                ? null
                : RoundToOneDecimal((decimal)elapsed.Average());

            var points = questionAnswers.Where(a => a.Points is not null).Select(a => a.Points!.Value).ToList();
            decimal? averagePoints = points.Count == 0
                ? null
                : RoundToOneDecimal((decimal)points.Average());

            var distinctPlayers = questionAnswers.Select(a => a.PlayerId).Distinct().Count();

            var options = questionOptions
                .Select(o => new QuizChoiceOptionStatsDto(
                    o.Id,
                    o.Order,
                    o.Text,
                    optionCounts.GetValueOrDefault(o.Id, 0),
                    o.IsCorrect))
                .ToList();

            return new QuizChoiceQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                distinctPlayers,
                possibleAnswers,
                correctCount,
                correctPercent,
                averageElapsed,
                averagePoints,
                options);
        }

        private static QuizChoiceQuestionStatsDto ToEmptyQuizChoiceQuestion(
            QuestionRow question,
            IReadOnlyList<QuizOptionRow> allOptions,
            int possibleAnswers)
        {
            var options = allOptions
                .Where(o => o.QuestionId == question.Id)
                .OrderBy(o => o.Order)
                .Select(o => new QuizChoiceOptionStatsDto(o.Id, o.Order, o.Text, 0, o.IsCorrect))
                .ToList();

            return new QuizChoiceQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                0,
                possibleAnswers,
                0,
                0m,
                null,
                null,
                options);
        }

        private static PollQuestionStatsDto BuildPollQuestion(
            QuestionRow question,
            IReadOnlyList<PollOptionRow> allOptions,
            IReadOnlyList<PollAnswerRow> allAnswers,
            int possibleAnswers)
        {
            var questionAnswers = allAnswers.Where(a => a.QuestionId == question.Id).ToList();
            var questionOptions = allOptions.Where(o => o.QuestionId == question.Id).OrderBy(o => o.Order).ToList();
            var optionCounts = questionAnswers
                .GroupBy(a => a.OptionId)
                .ToDictionary(g => g.Key, g => g.Count());

            var distinctPlayers = questionAnswers.Select(a => a.PlayerId).Distinct().Count();
            var options = questionOptions
                .Select(o => new PollOptionStatsDto(
                    o.Id,
                    o.Order,
                    o.Text,
                    optionCounts.GetValueOrDefault(o.Id, 0)))
                .ToList();

            return new PollQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                distinctPlayers,
                possibleAnswers,
                options);
        }

        private static PollQuestionStatsDto ToEmptyPollQuestion(
            QuestionRow question,
            IReadOnlyList<PollOptionRow> allOptions,
            int possibleAnswers)
        {
            var options = allOptions
                .Where(o => o.QuestionId == question.Id)
                .OrderBy(o => o.Order)
                .Select(o => new PollOptionStatsDto(o.Id, o.Order, o.Text, 0))
                .ToList();

            return new PollQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                0,
                possibleAnswers,
                options);
        }

        private static OpenQuestionStatsDto BuildOpenQuestionForQuiz(
            QuestionRow question,
            IReadOnlyList<OpenAnswerRow> allAnswers,
            int possibleAnswers)
        {
            var rows = allAnswers.Where(a => a.QuestionId == question.Id).ToList();
            var groupingRows = rows.Select(r => (r.Text, r.IsHidden)).ToList();
            var (answers, otherCount) = OpenTextAnswerGrouper.GroupForQuiz(groupingRows);
            var hiddenCount = OpenTextAnswerGrouper.CountHidden(groupingRows);
            var distinctPlayers = rows.Where(r => !r.IsHidden).Select(r => r.PlayerId).Distinct().Count();

            return new OpenQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                distinctPlayers,
                possibleAnswers,
                rows.Count,
                hiddenCount,
                answers,
                otherCount,
                null);
        }

        private static OpenQuestionStatsDto BuildOpenQuestionForGame(
            QuestionRow question,
            IReadOnlyList<OpenAnswerDetailRow> allAnswers,
            int possibleAnswers)
        {
            var rows = allAnswers.Where(a => a.QuestionId == question.Id).ToList();
            var groupingRows = rows.Select(r => (r.Text, r.IsHidden)).ToList();
            var answers = OpenTextAnswerGrouper.GroupForGame(groupingRows);
            var hiddenCount = OpenTextAnswerGrouper.CountHidden(groupingRows);
            var distinctPlayers = rows.Where(r => !r.IsHidden).Select(r => r.PlayerId).Distinct().Count();

            var entries = rows
                .Select(r => new OpenAnswerEntryDto(
                    r.PlayerId,
                    r.Nickname,
                    r.Text,
                    r.IsHidden,
                    r.AnsweredAtUtc))
                .ToList();

            return new OpenQuestionStatsDto(
                question.Id,
                question.Order,
                question.Text,
                distinctPlayers,
                possibleAnswers,
                rows.Count,
                hiddenCount,
                answers,
                0,
                entries);
        }

        private sealed record FinishedGameRow(int Id, DateTime CreatedAtUtc, DateTime EndedAtUtc);

        private sealed record QuestionRow(int Id, int Order, string Text);

        private sealed record QuizOptionRow(int Id, int QuestionId, int Order, string Text, bool IsCorrect);

        private sealed record QuizAnswerRow(
            int QuestionId,
            int OptionId,
            int PlayerId,
            bool IsCorrect,
            int? ElapsedMs,
            int? Points);

        private sealed record PollOptionRow(int Id, int QuestionId, int Order, string Text);

        private sealed record PollAnswerRow(int QuestionId, int OptionId, int PlayerId);

        private sealed record OpenAnswerRow(int QuestionId, int PlayerId, string Text, bool IsHidden);

        private sealed record OpenAnswerDetailRow(
            int QuestionId,
            int PlayerId,
            string Nickname,
            string Text,
            bool IsHidden,
            DateTime AnsweredAtUtc);

        private sealed record QuizRunMetrics(decimal? AveragePoints, decimal CorrectPercent);
    }
}