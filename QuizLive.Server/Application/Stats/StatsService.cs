using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Application.Stats
{
    public class StatsService(AppDbContext db, ICurrentUser currentUser) : IStatsService
    {
        private const int ActivityDays = 30;

        public async Task<HostStatsDto> GetMyStatsAsync()
        {
            var userId = currentUser.UserId;

            var quizStats = await BuildQuizStatsAsync(userId);
            var questionStats = await BuildQuestionStatsAsync(userId, quizStats.Total);
            var gameStats = await BuildGameStatsAsync(userId);
            var playerStats = await BuildPlayerStatsAsync(userId, gameStats.Total);
            var activityStats = await BuildActivityStatsAsync(userId);

            return new HostStatsDto(
                quizStats,
                questionStats,
                gameStats,
                playerStats,
                activityStats);
        }

        private async Task<QuizStatsDto> BuildQuizStatsAsync(string userId)
        {
            var byKindRows = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.OwnerId == userId)
                .GroupBy(q => q.Kind)
                .Select(g => new { Kind = g.Key, Count = g.Count() })
                .ToListAsync();

            var archived = await db.Quizzes
                .AsNoTracking()
                .Where(q => q.OwnerId == userId && q.IsArchived)
                .CountAsync();

            var total = byKindRows.Sum(r => r.Count);
            var byKind = ToKindCounts(byKindRows.ToDictionary(r => r.Kind, r => r.Count));

            return new QuizStatsDto(total, archived, byKind);
        }

        private async Task<QuestionStatsDto> BuildQuestionStatsAsync(string userId, int quizTotal)
        {
            var owned = db.Quizzes.AsNoTracking().Where(q => q.OwnerId == userId);

            var openTotal = await owned.SelectMany(q => q.OpenQuestions).CountAsync();
            var pollTotal = await owned.SelectMany(q => q.PollQuestions).CountAsync();
            var quizTotalQuestions = await owned.SelectMany(q => q.QuizQuestions).CountAsync();

            var total = openTotal + pollTotal + quizTotalQuestions;
            var average = quizTotal == 0
                ? 0m
                : RoundToOneDecimal((decimal)total / quizTotal);

            return new QuestionStatsDto(total, average);
        }

        private async Task<GameStatsDto> BuildGameStatsAsync(string userId)
        {
            var games = db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.HostUserId == userId);

            var total = await games.CountAsync();
            var active = await games.Where(g => g.EndedAtUtc == null).CountAsync();
            var finished = await games.Where(g => g.EndedAtUtc != null).CountAsync();

            var byStatusRows = await games
                .GroupBy(g => g.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var byKindRows = await games
                .GroupBy(g => g.Quiz.Kind)
                .Select(g => new { Kind = g.Key, Count = g.Count() })
                .ToListAsync();

            var byStatus = ToStatusCounts(byStatusRows.ToDictionary(r => r.Status, r => r.Count));
            var byKind = ToKindCounts(byKindRows.ToDictionary(r => r.Kind, r => r.Count));

            return new GameStatsDto(total, active, finished, byStatus, byKind);
        }

        private async Task<PlayerStatsDto> BuildPlayerStatsAsync(string userId, int gameTotal)
        {
            var gameIds = db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.HostUserId == userId)
                .Select(g => g.Id);

            var totalJoins = await db.Players
                .AsNoTracking()
                .Where(p => gameIds.Contains(p.GameSessionRecordId))
                .CountAsync();

            var maxInOneGame = gameTotal == 0
                ? 0
                : await db.Players
                    .AsNoTracking()
                    .Where(p => gameIds.Contains(p.GameSessionRecordId))
                    .GroupBy(p => p.GameSessionRecordId)
                    .Select(g => g.Count())
                    .DefaultIfEmpty(0)
                    .MaxAsync();

            var average = gameTotal == 0
                ? 0m
                : RoundToOneDecimal((decimal)totalJoins / gameTotal);

            return new PlayerStatsDto(totalJoins, average, maxInOneGame);
        }

        private async Task<ActivityStatsDto> BuildActivityStatsAsync(string userId)
        {
            var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);
            var windowStart = todayUtc.AddDays(-(ActivityDays - 1));

            var rangeStartUtc = windowStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var createdTimestamps = await db.GameSessionRecords
                .AsNoTracking()
                .Where(g => g.HostUserId == userId && g.CreatedAtUtc >= rangeStartUtc)
                .Select(g => g.CreatedAtUtc)
                .ToListAsync();

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
            var last30Start = windowStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

            var gamesLast7Days = createdTimestamps.Count(t => t >= last7Start);
            var gamesLast30Days = createdTimestamps.Count;

            return new ActivityStatsDto(gamesLast7Days, gamesLast30Days, gamesPerDay);
        }

        private static KindCountsDto ToKindCounts(IReadOnlyDictionary<QuizKind, int> counts)
        {
            return new KindCountsDto(
                counts.GetValueOrDefault(QuizKind.OpenText, 0),
                counts.GetValueOrDefault(QuizKind.PollChoice, 0),
                counts.GetValueOrDefault(QuizKind.QuizChoice, 0));
        }

        private static StatusCountsDto ToStatusCounts(IReadOnlyDictionary<GameStatus, int> counts)
        {
            return new StatusCountsDto(
                counts.GetValueOrDefault(GameStatus.Lobby, 0),
                counts.GetValueOrDefault(GameStatus.Question, 0),
                counts.GetValueOrDefault(GameStatus.Results, 0),
                counts.GetValueOrDefault(GameStatus.Finished, 0));
        }

        private static decimal RoundToOneDecimal(decimal value) =>
            Math.Round(value, 1, MidpointRounding.AwayFromZero);
    }
}