using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Regressions
{
    // Error responses fixed in #50.
    public class ErrorResponseRegressionTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        [Theory]
        [InlineData(QuizKind.PollChoice, 0)]
        [InlineData(QuizKind.PollChoice, 1)]
        [InlineData(QuizKind.QuizChoice, 0)]
        [InlineData(QuizKind.QuizChoice, 1)]
        public async Task CreateQuestion_WithNullOption_Returns400(QuizKind kind, int nullIndex)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);

            var response = await client.PostAsJsonAsync(
                $"/api/quizzes/{quiz.Id}/questions", WithNullOption(kind, nullIndex), Ct);

            await AssertNullOptionErrorAsync(response, nullIndex);
        }

        [Theory]
        [InlineData(QuizKind.PollChoice, 0)]
        [InlineData(QuizKind.PollChoice, 1)]
        [InlineData(QuizKind.QuizChoice, 0)]
        [InlineData(QuizKind.QuizChoice, 1)]
        public async Task UpdateQuestion_WithNullOption_Returns400(QuizKind kind, int nullIndex)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var question = await client.AddQuestionAsync(quiz.Id, kind);

            var response = await client.PutAsJsonAsync(
                $"/api/quizzes/{quiz.Id}/questions/{question.Id}", WithNullOption(kind, nullIndex), Ct);

            await AssertNullOptionErrorAsync(response, nullIndex);
        }

        [Theory]
        [InlineData(QuizKind.OpenText)]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task UpdateAndDeleteQuestion_OfAnotherQuizWithAnswers_Return404(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var otherQuiz = await client.CreateQuizAsync(kind);
            var answered = await client.AddQuestionAsync(otherQuiz.Id, kind);
            await AnswerInFinishedGameAsync(client, otherQuiz.Id, kind, answered);
            var url = $"/api/quizzes/{quiz.Id}/questions/{answered.Id}";

            var update = await client.PutAsJsonAsync(url, ApiClientExtensions.ValidQuestion(kind), Ct);
            var delete = await client.DeleteAsync(url, Ct);

            var updateProblem = await ProblemAssert.HasStatusAsync(update, HttpStatusCode.NotFound);
            Assert.Equal(QuestionMessages.NotFound(answered.Id), updateProblem.Detail);
            await ProblemAssert.HasStatusAsync(delete, HttpStatusCode.NotFound);

            // Through its own quiz the question is locked by the answer, so the 404 above is not caused by a missing answer.
            var ownUpdate = await client.PutAsJsonAsync(
                $"/api/quizzes/{otherQuiz.Id}/questions/{answered.Id}", ApiClientExtensions.ValidQuestion(kind), Ct);
            var ownProblem = await ProblemAssert.HasStatusAsync(ownUpdate, HttpStatusCode.Conflict);
            Assert.Equal(QuestionMessages.HasAnswers, ownProblem.Detail);
        }

        [Fact]
        public async Task DeleteQuiz_WithFinishedGame_Returns409AndQuizCanBeArchived()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            var game = await client.CreateGameAsync(quiz.Id);
            await EndGameAsync(client, game.Id);

            var delete = await client.DeleteAsync($"/api/quizzes/{quiz.Id}", Ct);

            var problem = await ProblemAssert.HasStatusAsync(delete, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.HasGames, problem.Detail);

            var get = await client.GetAsync($"/api/quizzes/{quiz.Id}", Ct);
            Assert.Equal(HttpStatusCode.OK, get.StatusCode);

            var archive = await client.PostAsync($"/api/quizzes/{quiz.Id}/archive", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);
        }

        [Fact]
        public async Task DeleteQuiz_WithActiveGame_Returns409()
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            await client.CreateGameAsync(quiz.Id);

            var delete = await client.DeleteAsync($"/api/quizzes/{quiz.Id}", Ct);

            var problem = await ProblemAssert.HasStatusAsync(delete, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.HasActiveGame, problem.Detail);
        }

        [Theory]
        [InlineData(QuizKind.OpenText)]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task DeleteQuiz_WithoutGames_DeletesQuizAndQuestions(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(kind);

            var delete = await client.DeleteAsync($"/api/quizzes/{quiz.Id}", Ct);

            Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

            var get = await client.GetAsync($"/api/quizzes/{quiz.Id}", Ct);
            Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
            Assert.Equal(0, await CountQuestionsAsync(quiz.Id, kind));
        }

        private static QuestionRequest WithNullOption(QuizKind kind, int nullIndex)
        {
            var valid = ApiClientExtensions.ValidQuestion(kind);
            var options = valid.Options!.Take(nullIndex).Append(null!).ToList();

            return valid with { Options = options };
        }

        private static async Task AssertNullOptionErrorAsync(HttpResponseMessage response, int nullIndex)
        {
            var key = $"options[{nullIndex}]";

            var problem = await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, key);
            Assert.Contains(QuestionMessages.OptionRequired, problem.Errors[key]);
        }

        // No endpoint stores answers yet, so the answer is inserted directly.
        private async Task AnswerInFinishedGameAsync(HttpClient host, int quizId, QuizKind kind, QuestionDto question)
        {
            var game = await host.CreateGameAsync(quizId);
            var player = await factory.CreateClient().JoinAsync(game.Code, "Player");

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                switch (kind)
                {
                    case QuizKind.OpenText:
                        db.OpenAnswers.Add(new OpenAnswer { OpenQuestionId = question.Id, PlayerId = player.PlayerId, Text = "Kyiv" });
                        break;
                    case QuizKind.PollChoice:
                        db.PollAnswers.Add(new PollAnswer
                        {
                            PollQuestionId = question.Id,
                            PlayerId = player.PlayerId,
                            PollOptionId = question.Options![0].Id
                        });
                        break;
                    case QuizKind.QuizChoice:
                        db.QuizAnswers.Add(new QuizAnswer
                        {
                            QuizQuestionId = question.Id,
                            PlayerId = player.PlayerId,
                            QuizOptionId = question.Options![0].Id,
                            IsCorrect = true
                        });
                        break;
                }

                await db.SaveChangesAsync(Ct);
            }

            await EndGameAsync(host, game.Id);
        }

        private async Task<int> CountQuestionsAsync(int quizId, QuizKind kind)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return kind switch
            {
                QuizKind.OpenText => await db.OpenQuestions.CountAsync(q => q.QuizId == quizId, Ct),
                QuizKind.PollChoice => await db.PollQuestions.CountAsync(q => q.QuizId == quizId, Ct),
                QuizKind.QuizChoice => await db.QuizQuestions.CountAsync(q => q.QuizId == quizId, Ct),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }
    }
}
