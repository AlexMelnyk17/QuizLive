using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Games;

public static class ScoreCalculator
{
    // Correct answers earn base points plus up to 50% for speed, rounded down.
    // Untimed questions have no speed bonus. Extensions count toward the available time.
    public static int Calculate(QuizKind kind, bool correct, int? basePoints, double elapsedMs, double? durationMs)
    {
        if (kind != QuizKind.QuizChoice || !correct) return 0;
        var points = Math.Max(0, basePoints ?? 0);
        var remaining = durationMs is > 0 ? 1 - Math.Clamp(elapsedMs / durationMs.Value, 0, 1) : 0;
        return points + (int)Math.Floor(points * 0.5 * remaining);
    }
}
