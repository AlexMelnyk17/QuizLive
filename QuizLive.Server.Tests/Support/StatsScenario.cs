using System.Net;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Core.Entities.Games;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;

namespace QuizLive.Server.Tests.Support;

// Fixed historical data: two finished runs, one active run, and one unanswered question.
internal sealed record StatsScenario(
    HttpClient Host, int QuizId, QuestionDto FirstQuestion, QuestionDto EmptyQuestion,
    GameSessionRecord Older, GameSessionRecord Newer, GameSessionRecord Active) : IDisposable
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    public static async Task<StatsScenario> CreateAsync(QuizLiveFactory factory, QuizKind kind)
    {
        var host = await factory.CreateAuthorizedClientAsync();
        var quiz = await host.CreateQuizAsync(kind, "Historical quiz");
        var first = await host.AddQuestionAsync(quiz.Id, kind);
        var empty = await host.AddQuestionAsync(quiz.Id, kind);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var owner = (await db.Quizzes.FindAsync([quiz.Id], Ct))!.OwnerId;
        var today = DateTime.UtcNow.Date;

        GameSessionRecord Run(int daysAgo, int? seconds, params string[] names)
        {
            var created = today.AddDays(-daysAgo).AddHours(12);
            return new GameSessionRecord
            {
                QuizId = quiz.Id, HostUserId = owner, Code = GameCodeGenerator.Generate(),
                CreatedAtUtc = created, EndedAtUtc = seconds is null ? null : created.AddSeconds(seconds.Value),
                Status = seconds is null ? GameStatus.Lobby : GameStatus.Finished,
                Players = names.Select((name, index) => new Player { Nickname = name, JoinedAtUtc = created.AddSeconds(index) }).ToList()
            };
        }

        var older = Run(31, 60, "Anna", "Bohdan");
        var newer = Run(7, 90, "Chen", "Idle");
        var active = Run(1, null, "Still playing");
        db.GameSessionRecords.AddRange(older, newer, active);
        await db.SaveChangesAsync(Ct);

        var players = new[] { older.Players[0], older.Players[1], newer.Players[0], active.Players[0] };
        for (var index = 0; index < players.Length; index++)
        {
            var player = players[index];
            switch (kind)
            {
                case QuizKind.QuizChoice:
                    var correct = index != 1;
                    db.QuizAnswers.Add(new QuizAnswer
                    {
                        QuizQuestionId = first.Id, PlayerId = player.Id,
                        QuizOptionId = first.Options!.Single(option => option.IsCorrect == correct).Id,
                        IsCorrect = correct, Points = index == 2 ? null : index == 1 ? 0 : 100,
                        ElapsedMs = index == 1 ? null : index == 2 ? 3000 : 1000
                    });
                    break;
                case QuizKind.PollChoice:
                    db.PollAnswers.Add(new PollAnswer { PollQuestionId = first.Id, PlayerId = player.Id, PollOptionId = first.Options![index == 1 ? 1 : 0].Id });
                    break;
                case QuizKind.OpenText:
                    db.OpenAnswers.Add(new OpenAnswer
                    {
                        OpenQuestionId = first.Id, PlayerId = player.Id,
                        Text = index switch { 0 => " Tea ", 1 => "tea", 2 => "Coffee", _ => "Active answer" },
                        IsHidden = index == 1, AnsweredAtUtc = player.JoinedAtUtc.AddSeconds(10)
                    });
                    break;
            }
        }
        await db.SaveChangesAsync(Ct);
        return new StatsScenario(host, quiz.Id, first, empty, older, newer, active);
    }

    public async Task<QuizPlayStatsDto> QuizStatsAsync() =>
        await (await Host.GetAsync($"/api/stats/quizzes/{QuizId}", Ct)).ReadAsync<QuizPlayStatsDto>(HttpStatusCode.OK);

    public async Task<GamePlayStatsDto> GameStatsAsync(int gameId) =>
        await (await Host.GetAsync($"/api/stats/games/{gameId}", Ct)).ReadAsync<GamePlayStatsDto>(HttpStatusCode.OK);

    public void Dispose() => Host.Dispose();
}
