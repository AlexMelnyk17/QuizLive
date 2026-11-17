using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Tests.Games;

public class ScoreCalculatorTests
{
    [Theory]
    [InlineData(QuizKind.OpenText, true, 100, 0, 30000, 0)]
    [InlineData(QuizKind.PollChoice, true, 100, 0, 30000, 0)]
    [InlineData(QuizKind.QuizChoice, false, 100, 0, 30000, 0)]
    [InlineData(QuizKind.QuizChoice, true, 100, 0, 30000, 150)]
    [InlineData(QuizKind.QuizChoice, true, 100, 15000, 30000, 125)]
    [InlineData(QuizKind.QuizChoice, true, 100, 30000, 30000, 100)]
    [InlineData(QuizKind.QuizChoice, true, 100, 50000, 30000, 100)]
    [InlineData(QuizKind.QuizChoice, true, 100, -10, 30000, 150)]
    [InlineData(QuizKind.QuizChoice, true, 100, 0, null, 100)]
    [InlineData(QuizKind.QuizChoice, true, 100, 0, 0, 100)]
    [InlineData(QuizKind.QuizChoice, true, 101, 15000, 30000, 126)]
    [InlineData(QuizKind.QuizChoice, true, 0, 0, 30000, 0)]
    [InlineData(QuizKind.QuizChoice, true, null, 0, 30000, 0)]
    public void PointsFollowCorrectnessAndServerTime(QuizKind kind, bool correct, int? points, double elapsed, int? duration, int expected) =>
        Assert.Equal(expected, ScoreCalculator.Calculate(kind, correct, points, elapsed, duration));
}
