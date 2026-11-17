using System.Net;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Stats;

public class OpenTextStatisticsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Grouping_NormalizesCaseAndSpacesAndChoosesMostCommonOriginalText(bool quizLevel)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var ids = await CreateAnswersAsync(host,
            [(" Tea ", false), ("tea", false), ("tea", false), ("TEA", false),
             ("Coffee", false), ("coffee", false), ("ЧАЙ", false), ("чай", false)]);

        var question = await ReadQuestionAsync(host, ids, quizLevel);

        Assert.Equal([new OpenAnswerFrequencyDto("tea", 4), new("Coffee", 2), new("ЧАЙ", 2)], question.Answers);
        Assert.Equal(8, question.AnswerCount);
        Assert.Equal(8, question.PlayerAnsweredCount);
        Assert.Equal(8, question.PossibleAnswers);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task HiddenAndBlankAnswers_DoNotAppearInVisibleFrequencies(bool quizLevel)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var ids = await CreateAnswersAsync(host, [("secret", true), ("secret", true), (" ", false), ("", false), ("Tea", false)]);

        var question = await ReadQuestionAsync(host, ids, quizLevel);

        Assert.Equal([new OpenAnswerFrequencyDto("Tea", 1)], question.Answers);
        Assert.Equal(2, question.HiddenCount);
        Assert.Equal(5, question.AnswerCount);
        Assert.Equal(0, question.OtherCount);
        if (quizLevel) Assert.Null(question.Entries);
        else
        {
            Assert.Equal(5, question.Entries!.Count);
            Assert.Equal(2, question.Entries.Count(entry => entry.IsHidden));
            Assert.All(question.Entries, entry => { Assert.True(entry.PlayerId > 0); Assert.StartsWith("Player", entry.Nickname); });
        }
    }

    [Theory]
    [InlineData(39)]
    [InlineData(40)]
    [InlineData(43)]
    public async Task QuizLimitsToTop40_WhileGameIncludesAllAnswers_AndOtherCountCountsResponses(int distinctCount)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var rows = Enumerable.Range(0, distinctCount)
            .SelectMany(index => new[] { ($"Answer {index:D2}", false), ($"Answer {index:D2}", false) }).ToList();
        rows.Add(("Most popular", false)); rows.Add(("Most popular", false)); rows.Add(("Most popular", false));
        rows.Add(("Hidden", true));
        var ids = await CreateAnswersAsync(host, rows);

        var quizQuestion = await ReadQuestionAsync(host, ids, true);
        var gameQuestion = await ReadQuestionAsync(host, ids, false);

        Assert.Equal(Math.Min(40, distinctCount + 1), quizQuestion.Answers.Count);
        Assert.Equal(new OpenAnswerFrequencyDto("Most popular", 3), quizQuestion.Answers[0]);
        Assert.Equal(Math.Max(0, distinctCount + 1 - 40) * 2, quizQuestion.OtherCount);
        Assert.Equal(distinctCount + 1, gameQuestion.Answers.Count);
        Assert.Equal(0, gameQuestion.OtherCount);
        Assert.Equal(gameQuestion.Answers.Take(40), quizQuestion.Answers);
        Assert.Equal(1, quizQuestion.HiddenCount);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task AllHiddenAnswers_ReturnEmptyVisibleResults(bool quizLevel)
    {
        using var host = await factory.CreateAuthorizedClientAsync();
        var ids = await CreateAnswersAsync(host, [("Hidden", true)]);

        var question = await ReadQuestionAsync(host, ids, quizLevel);

        Assert.Empty(question.Answers);
        Assert.Equal(1, question.HiddenCount);
        Assert.Equal(0, question.PlayerAnsweredCount);
        Assert.Equal(1, question.PossibleAnswers);
    }

    private async Task<(int QuizId, int GameId)> CreateAnswersAsync(HttpClient host, IReadOnlyList<(string Text, bool Hidden)> rows)
    {
        var quiz = await host.CreateQuizAsync(QuizKind.OpenText);
        var question = await host.AddQuestionAsync(quiz.Id, QuizKind.OpenText);
        var game = await host.CreateGameAsync(quiz.Id);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            for (var index = 0; index < rows.Count; index++)
            {
                var row = rows[index];
                db.OpenAnswers.Add(new OpenAnswer
                {
                    OpenQuestionId = question.Id,
                    Player = new Player { GameSessionRecordId = game.Id, Nickname = $"Player{index}" },
                    Text = row.Text, IsHidden = row.Hidden
                });
            }
            await db.SaveChangesAsync(Ct);
        }
        Assert.Equal(HttpStatusCode.NoContent, (await host.PostAsync($"/api/games/{game.Id}/end", null, Ct)).StatusCode);
        return (quiz.Id, game.Id);
    }

    private static async Task<OpenQuestionStatsDto> ReadQuestionAsync(HttpClient host, (int QuizId, int GameId) ids, bool quizLevel)
    {
        if (quizLevel)
        {
            var quiz = await (await host.GetAsync($"/api/stats/quizzes/{ids.QuizId}", Ct)).ReadAsync<QuizPlayStatsDto>(HttpStatusCode.OK);
            return Assert.Single(quiz.OpenQuestions!);
        }
        var game = await (await host.GetAsync($"/api/stats/games/{ids.GameId}", Ct)).ReadAsync<GamePlayStatsDto>(HttpStatusCode.OK);
        return Assert.Single(game.OpenQuestions!);
    }
}
