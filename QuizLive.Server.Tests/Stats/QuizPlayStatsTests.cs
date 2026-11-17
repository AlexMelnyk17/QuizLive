using System.Net;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Stats;

public class QuizPlayStatsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task QuizStats_RequiresAuthenticationAndDoesNotExposeOtherOwnersQuiz()
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        using var other = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreateQuizAsync(QuizKind.OpenText);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync($"/api/stats/quizzes/{quiz.Id}", Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/stats/quizzes/{quiz.Id}", Ct)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await host.GetAsync("/api/stats/quizzes/2147483647", Ct)).StatusCode);
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task QuizWithoutQuestionsOrGames_ReturnsZeroStatistics(QuizKind kind)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreateQuizAsync(kind);
        var stats = await (await host.GetAsync($"/api/stats/quizzes/{quiz.Id}", Ct)).ReadAsync<QuizPlayStatsDto>(HttpStatusCode.OK);

        Assert.Equal(quiz.Id, stats.QuizId);
        Assert.Equal(kind, stats.Kind);
        Assert.Equal(0, stats.QuestionCount);
        Assert.Equal(new QuizPlayGameStatsDto(0, 0, null, null), stats.Games);
        Assert.Equal(new PlayerStatsDto(0, 0m, 0), stats.Players);
        Assert.Empty(stats.Runs);
        Assert.Equal(30, stats.Activity.GamesPerDay.Count);
        Assert.All(stats.Activity.GamesPerDay, day => Assert.Equal(0, day.Count));
        Assert.Empty(kind switch { QuizKind.QuizChoice => stats.QuizChoiceQuestions!.Select(question => question.QuestionId), QuizKind.PollChoice => stats.PollQuestions!.Select(question => question.QuestionId), _ => stats.OpenQuestions!.Select(question => question.QuestionId) });
    }

    [Theory]
    [InlineData(QuizKind.OpenText, false)]
    [InlineData(QuizKind.PollChoice, false)]
    [InlineData(QuizKind.QuizChoice, false)]
    [InlineData(QuizKind.OpenText, true)]
    [InlineData(QuizKind.PollChoice, true)]
    [InlineData(QuizKind.QuizChoice, true)]
    public async Task QuestionsWithoutAnswers_KeepOptionsAndNullAverages(QuizKind kind, bool finished)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(kind);
        var game = await host.CreateGameAsync(quiz.Id);
        if (finished) Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{game.Id}/end", null, Ct)).StatusCode);
        var stats = await (await host.GetAsync($"/api/stats/quizzes/{quiz.Id}", Ct)).ReadAsync<QuizPlayStatsDto>(HttpStatusCode.OK);

        Assert.Equal(1, stats.QuestionCount);
        Assert.Equal(1, stats.Games.Total);
        Assert.Equal(finished ? 1 : 0, stats.Games.Finished);
        Assert.Equal(game.CreatedAtUtc, stats.Games.LastPlayedAtUtc);
        Assert.Equal(new PlayerStatsDto(0, 0m, 0), stats.Players);
        Assert.Equal(finished ? 1 : 0, stats.Runs.Count);
        if (finished) Assert.NotNull(stats.Games.AverageDurationSeconds);
        else Assert.Null(stats.Games.AverageDurationSeconds);
        switch (kind)
        {
            case QuizKind.QuizChoice:
                var scored = Assert.Single(stats.QuizChoiceQuestions!);
                Assert.Null(scored.AveragePoints);
                Assert.Null(scored.AverageElapsedMs);
                Assert.Equal(0m, scored.CorrectPercent);
                Assert.Equal(0, scored.PossibleAnswers);
                Assert.All(scored.Options, option => Assert.Equal(0, option.Count));
                Assert.Null(stats.PollQuestions); Assert.Null(stats.OpenQuestions);
                break;
            case QuizKind.PollChoice:
                var poll = Assert.Single(stats.PollQuestions!);
                Assert.Equal(0, poll.PlayerAnsweredCount);
                Assert.All(poll.Options, option => Assert.Equal(0, option.Count));
                Assert.Null(stats.QuizChoiceQuestions); Assert.Null(stats.OpenQuestions);
                break;
            case QuizKind.OpenText:
                var open = Assert.Single(stats.OpenQuestions!);
                Assert.Empty(open.Answers);
                Assert.Null(open.Entries);
                Assert.Equal(0, open.HiddenCount);
                Assert.Null(stats.QuizChoiceQuestions); Assert.Null(stats.PollQuestions);
                break;
        }
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task QuizHistory_AggregatesFinishedRunsAndExcludesActiveAnswers(QuizKind kind)
    {
        using var scenario = await StatsScenario.CreateAsync(factory, kind);
        var stats = await scenario.QuizStatsAsync();

        Assert.Equal(2, stats.QuestionCount);
        Assert.Equal(3, stats.Games.Total);
        Assert.Equal(2, stats.Games.Finished);
        Assert.Equal(75m, stats.Games.AverageDurationSeconds);
        Assert.Equal(scenario.Active.CreatedAtUtc, stats.Games.LastPlayedAtUtc);
        Assert.Equal(new PlayerStatsDto(5, 1.7m, 2), stats.Players);
        Assert.Equal([scenario.Newer.Id, scenario.Older.Id], stats.Runs.Select(run => run.GameId));
        Assert.Equal([90m, 60m], stats.Runs.Select(run => run.DurationSeconds));
        Assert.All(stats.Runs, run => Assert.Equal(2, run.PlayerCount));
        Assert.Equal(1, stats.Activity.GamesLast7Days);
        Assert.Equal(2, stats.Activity.GamesLast30Days);
        Assert.Equal(2, stats.Activity.GamesPerDay.Sum(day => day.Count));
        Assert.Equal(DateOnly.FromDateTime(DateTime.UtcNow), stats.Activity.GamesPerDay[^1].Date);

        switch (kind)
        {
            case QuizKind.QuizChoice:
                var scored = stats.QuizChoiceQuestions![0];
                Assert.Equal(3, scored.PlayerAnsweredCount); Assert.Equal(4, scored.PossibleAnswers);
                Assert.Equal(2, scored.CorrectCount); Assert.Equal(66.7m, scored.CorrectPercent);
                Assert.Equal(2000m, scored.AverageElapsedMs); Assert.Equal(50m, scored.AveragePoints);
                Assert.Equal([2, 1], scored.Options.Select(option => option.Count));
                Assert.Null(stats.QuizChoiceQuestions[1].AveragePoints);
                Assert.Equal(0m, stats.QuizChoiceQuestions[1].CorrectPercent);
                Assert.Null(stats.Runs[0].AveragePoints); Assert.Equal(100m, stats.Runs[0].CorrectPercent);
                Assert.Equal(50m, stats.Runs[1].AveragePoints); Assert.Equal(50m, stats.Runs[1].CorrectPercent);
                Assert.All(stats.Runs, run => Assert.Null(run.AnswerCount));
                break;
            case QuizKind.PollChoice:
                var poll = stats.PollQuestions![0];
                Assert.Equal(3, poll.PlayerAnsweredCount); Assert.Equal(4, poll.PossibleAnswers);
                Assert.Equal([2, 1], poll.Options.Select(option => option.Count));
                Assert.Equal(0, stats.PollQuestions[1].PlayerAnsweredCount);
                Assert.Equal([1, 2], stats.Runs.Select(run => run.AnswerCount));
                Assert.All(stats.Runs, run => { Assert.Null(run.AveragePoints); Assert.Null(run.CorrectPercent); });
                break;
            case QuizKind.OpenText:
                var open = stats.OpenQuestions![0];
                Assert.Equal(3, open.AnswerCount); Assert.Equal(1, open.HiddenCount);
                Assert.Equal(2, open.PlayerAnsweredCount); Assert.Equal(4, open.PossibleAnswers);
                Assert.Equal([" Tea ", "Coffee"], open.Answers.Select(answer => answer.Text));
                Assert.Null(open.Entries); Assert.Empty(stats.OpenQuestions[1].Answers);
                Assert.Equal([1, 2], stats.Runs.Select(run => run.AnswerCount));
                break;
        }
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task FinishedGame_ReportsOnlyItsPlayersAndAnswers(QuizKind kind)
    {
        using var scenario = await StatsScenario.CreateAsync(factory, kind);
        var stats = await scenario.GameStatsAsync(scenario.Newer.Id);
        Assert.Equal(scenario.QuizId, stats.QuizId); Assert.Equal(kind, stats.Kind);
        Assert.Equal(scenario.Newer.CreatedAtUtc, stats.CreatedAtUtc);
        Assert.Equal(scenario.Newer.EndedAtUtc, stats.EndedAtUtc);
        Assert.Equal(90m, stats.DurationSeconds); Assert.Equal(2, stats.PlayerCount);
        Assert.Equal(["Chen", "Idle"], stats.Players.Select(player => player.Nickname));
        Assert.Equal([1, 0], stats.Players.Select(player => player.AnswerCount));
        if (kind == QuizKind.QuizChoice)
        {
            Assert.Equal([1, 0], stats.Players.Select(player => player.CorrectCount));
            Assert.All(stats.Players, player => Assert.Equal(0, player.TotalPoints));
            Assert.Null(stats.QuizChoiceQuestions![0].AveragePoints);
            Assert.Equal(3000m, stats.QuizChoiceQuestions[0].AverageElapsedMs);
            Assert.Equal(2, stats.QuizChoiceQuestions[0].PossibleAnswers);
        }
        else Assert.All(stats.Players, player => { Assert.Null(player.CorrectCount); Assert.Null(player.TotalPoints); });
        if (kind == QuizKind.OpenText)
        {
            var question = stats.OpenQuestions![0];
            Assert.Equal(1, question.AnswerCount); Assert.Equal(0, question.HiddenCount);
            Assert.Equal("Coffee", Assert.Single(question.Answers).Text);
            var entry = Assert.Single(question.Entries!);
            Assert.Equal("Chen", entry.Nickname); Assert.Equal("Coffee", entry.Text);
            Assert.False(entry.IsHidden); Assert.True(entry.AnsweredAtUtc > scenario.Newer.CreatedAtUtc);
            Assert.Empty(stats.OpenQuestions[1].Entries!);
        }
    }

    [Fact]
    public async Task GameStatistics_DoNotExposeOtherHostsFinishedGame()
    {
        using var scenario = await StatsScenario.CreateAsync(factory, QuizKind.OpenText);
        using var other = await factory.CreateAuthorizedClientAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/stats/games/{scenario.Older.Id}", Ct)).StatusCode);
    }

    [Theory]
    [InlineData(QuizKind.OpenText)]
    [InlineData(QuizKind.PollChoice)]
    [InlineData(QuizKind.QuizChoice)]
    public async Task FinishedGameWithoutPlayers_ReturnsEmptyPlayersAndQuestionBreakdowns(QuizKind kind)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreatePlayableQuizAsync(kind);
        var game = await host.CreateGameAsync(quiz.Id);
        Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{game.Id}/end", null, Ct)).StatusCode);
        var stats = await (await host.GetAsync($"/api/stats/games/{game.Id}", Ct)).ReadAsync<GamePlayStatsDto>(HttpStatusCode.OK);
        Assert.Equal(0, stats.PlayerCount);
        Assert.Empty(stats.Players);
        switch (kind)
        {
            case QuizKind.QuizChoice: Assert.Equal(0, Assert.Single(stats.QuizChoiceQuestions!).PossibleAnswers); break;
            case QuizKind.PollChoice: Assert.Equal(0, Assert.Single(stats.PollQuestions!).PossibleAnswers); break;
            default: Assert.Empty(Assert.Single(stats.OpenQuestions!).Entries!); break;
        }
    }
}
