using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Entities.OpenText;
using QuizLive.Server.Core.Entities.PollChoice;
using QuizLive.Server.Core.Entities.QuizChoice;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Questions
{
    public class QuestionsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static TheoryData<QuizKind> AllKinds => new() { QuizKind.OpenText, QuizKind.PollChoice, QuizKind.QuizChoice };

        public static TheoryData<string> EditOperations => new() { "create", "update", "delete", "reorder" };

        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task Create_AddsQuestionToTheEnd(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var first = await client.AddQuestionAsync(quiz.Id, kind);

            var response = await client.PostAsJsonAsync(
                QuestionsUrl(quiz.Id), ApiClientExtensions.ValidQuestion(kind) with { Text = "  Second  " }, Ct);
            var second = await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);

            Assert.Equal(1, first.Order);
            Assert.Equal(2, second.Order);
            Assert.Equal("Second", second.Text);
            Assert.Equal($"{QuestionsUrl(quiz.Id)}/{second.Id}", response.Headers.Location?.AbsolutePath);
        }

        [Fact]
        public async Task Create_OpenText_HasNoOptionsOrPoints()
        {
            var question = await CreateQuestionAsync(QuizKind.OpenText);

            Assert.Null(question.Options);
            Assert.Null(question.BasePoints);
        }

        [Fact]
        public async Task Create_PollChoice_HasOptionsWithoutCorrectOne()
        {
            var question = await CreateQuestionAsync(QuizKind.PollChoice);

            Assert.NotNull(question.Options);
            Assert.Equal(new[] { "Tea", "Coffee" }, question.Options.Select(o => o.Text));
            Assert.Equal(new[] { 1, 2 }, question.Options.Select(o => o.Order));
            Assert.All(question.Options, o => Assert.Null(o.IsCorrect));
            Assert.Null(question.BasePoints);
        }

        [Fact]
        public async Task Create_QuizChoice_HasOptionsWithCorrectOneAndPoints()
        {
            var question = await CreateQuestionAsync(QuizKind.QuizChoice);

            Assert.NotNull(question.Options);
            Assert.Equal(new[] { "4", "5" }, question.Options.Select(o => o.Text));
            Assert.Equal(new bool?[] { true, false }, question.Options.Select(o => o.IsCorrect));
            Assert.Equal(100, question.BasePoints);
        }

        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task GetAllAndGetById_ReturnQuestionsOfQuiz(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var first = await client.AddQuestionAsync(quiz.Id, kind);
            var second = await client.AddQuestionAsync(quiz.Id, kind);

            var all = await GetQuestionsAsync(client, quiz.Id);
            var byId = await client.GetAsync($"{QuestionsUrl(quiz.Id)}/{second.Id}", Ct);
            var single = await byId.ReadAsync<QuestionDto>(HttpStatusCode.OK);

            Assert.Equal(new[] { first.Id, second.Id }, all.Select(q => q.Id));
            Assert.Equal(second.Id, single.Id);
            Assert.Equal(second.Text, single.Text);
        }

        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task Update_ReplacesContentAndKeepsOrder(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var question = await client.AddQuestionAsync(quiz.Id, kind);
            await client.AddQuestionAsync(quiz.Id, kind);

            var response = await client.PutAsJsonAsync($"{QuestionsUrl(quiz.Id)}/{question.Id}", UpdatedQuestion(kind), Ct);
            var updated = await response.ReadAsync<QuestionDto>(HttpStatusCode.OK);

            Assert.Equal(question.Id, updated.Id);
            Assert.Equal(1, updated.Order);
            Assert.Equal("Updated", updated.Text);
            Assert.Equal(60, updated.TimeLimitSeconds);
            Assert.Equal("https://example.com/image.png", updated.ImageUrl);

            if (kind == QuizKind.OpenText)
            {
                Assert.Null(updated.Options);
                return;
            }

            // Options are replaced as a whole: new texts, new ids, orders from 1.
            Assert.NotNull(updated.Options);
            Assert.Equal(new[] { "A", "B", "C" }, updated.Options.Select(o => o.Text));
            Assert.Equal(new[] { 1, 2, 3 }, updated.Options.Select(o => o.Order));
            Assert.Empty(updated.Options.Select(o => o.Id).Intersect(question.Options!.Select(o => o.Id)));

            if (kind == QuizKind.QuizChoice)
            {
                Assert.Equal(new bool?[] { false, false, true }, updated.Options.Select(o => o.IsCorrect));
                Assert.Equal(500, updated.BasePoints);
            }
        }

        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task Delete_RenumbersFollowingQuestions(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var first = await client.AddQuestionAsync(quiz.Id, kind);
            var second = await client.AddQuestionAsync(quiz.Id, kind);
            var third = await client.AddQuestionAsync(quiz.Id, kind);

            var response = await client.DeleteAsync($"{QuestionsUrl(quiz.Id)}/{second.Id}", Ct);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var remaining = await GetQuestionsAsync(client, quiz.Id);
            Assert.Equal(new[] { first.Id, third.Id }, remaining.Select(q => q.Id));
            Assert.Equal(new[] { 1, 2 }, remaining.Select(q => q.Order));

            var deleted = await client.GetAsync($"{QuestionsUrl(quiz.Id)}/{second.Id}", Ct);
            var problem = await ProblemAssert.HasStatusAsync(deleted, HttpStatusCode.NotFound);
            Assert.Equal(QuestionMessages.NotFound(second.Id), problem.Detail);
        }

        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task Reorder_SetsNewOrder(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var first = await client.AddQuestionAsync(quiz.Id, kind);
            var second = await client.AddQuestionAsync(quiz.Id, kind);
            var third = await client.AddQuestionAsync(quiz.Id, kind);
            int[] newOrder = [third.Id, first.Id, second.Id];

            var response = await ReorderAsync(client, quiz.Id, newOrder);
            var reordered = await response.ReadAsync<List<QuestionDto>>(HttpStatusCode.OK);

            Assert.Equal(newOrder, reordered.Select(q => q.Id));
            Assert.Equal(new[] { 1, 2, 3 }, reordered.Select(q => q.Order));
            Assert.Equal(newOrder, (await GetQuestionsAsync(client, quiz.Id)).Select(q => q.Id));
        }

        [Theory]
        [InlineData("missing")]
        [InlineData("extra")]
        [InlineData("duplicate")]
        [InlineData("foreign")]
        public async Task Reorder_WithIdsNotMatchingQuestions_Returns400(string mismatch)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(QuizKind.OpenText);
            var first = await client.AddQuestionAsync(quiz.Id, QuizKind.OpenText);
            var second = await client.AddQuestionAsync(quiz.Id, QuizKind.OpenText);
            var otherQuiz = await client.CreateQuizAsync(QuizKind.OpenText);
            var foreign = await client.AddQuestionAsync(otherQuiz.Id, QuizKind.OpenText);

            int[] ids = mismatch switch
            {
                "missing" => [second.Id],
                "extra" => [second.Id, first.Id, foreign.Id],
                "duplicate" => [second.Id, second.Id],
                "foreign" => [second.Id, foreign.Id],
                _ => throw new ArgumentOutOfRangeException(nameof(mismatch))
            };

            var response = await ReorderAsync(client, quiz.Id, ids);

            var problem = await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "questionIds");
            Assert.Contains(QuestionMessages.OrderMustListAll, problem.Errors["questionIds"]);
            Assert.Equal(new[] { first.Id, second.Id }, (await GetQuestionsAsync(client, quiz.Id)).Select(q => q.Id));
        }

        // Updating a question with answers is covered in ErrorResponseRegressionTests.
        [Theory]
        [MemberData(nameof(AllKinds))]
        public async Task Delete_QuestionWithAnswers_Returns409(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);
            var question = await client.AddQuestionAsync(quiz.Id, kind);
            await AnswerInFinishedGameAsync(client, quiz.Id, kind, question);

            var response = await client.DeleteAsync($"{QuestionsUrl(quiz.Id)}/{question.Id}", Ct);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(QuestionMessages.HasAnswers, problem.Detail);
            Assert.Single(await GetQuestionsAsync(client, quiz.Id));
        }

        [Theory]
        [MemberData(nameof(EditOperations))]
        public async Task Edit_InArchivedQuiz_Returns409(string operation)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            var question = Assert.Single(await GetQuestionsAsync(client, quiz.Id));
            var archive = await client.PostAsync($"/api/quizzes/{quiz.Id}/archive", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

            var response = await SendEditAsync(client, quiz.Id, QuizKind.QuizChoice, question.Id, operation);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.IsArchived, problem.Detail);
        }

        [Theory]
        [MemberData(nameof(EditOperations))]
        public async Task Edit_InQuizWithActiveGame_Returns409(string operation)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreatePlayableQuizAsync(QuizKind.PollChoice);
            var question = Assert.Single(await GetQuestionsAsync(client, quiz.Id));
            await client.CreateGameAsync(quiz.Id);

            var response = await SendEditAsync(client, quiz.Id, QuizKind.PollChoice, question.Id, operation);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal(QuizMessages.HasActiveGame, problem.Detail);
        }

        [Theory]
        [InlineData("list")]
        [InlineData("get")]
        [InlineData("create")]
        [InlineData("update")]
        [InlineData("delete")]
        [InlineData("reorder")]
        public async Task AnotherUsersQuiz_Returns404(string operation)
        {
            var owner = await factory.CreateAuthorizedClientAsync();
            var stranger = await factory.CreateAuthorizedClientAsync();
            var quiz = await owner.CreatePlayableQuizAsync(QuizKind.OpenText);
            var question = Assert.Single(await GetQuestionsAsync(owner, quiz.Id));
            var url = QuestionsUrl(quiz.Id);

            var response = operation switch
            {
                "list" => await stranger.GetAsync(url, Ct),
                "get" => await stranger.GetAsync($"{url}/{question.Id}", Ct),
                _ => await SendEditAsync(stranger, quiz.Id, QuizKind.OpenText, question.Id, operation)
            };

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal(QuizMessages.NotFound(quiz.Id), problem.Detail);

            var unchanged = Assert.Single(await GetQuestionsAsync(owner, quiz.Id));
            Assert.Equal(question.Text, unchanged.Text);
        }

        private static string QuestionsUrl(int quizId) => $"/api/quizzes/{quizId}/questions";

        private async Task<QuestionDto> CreateQuestionAsync(QuizKind kind)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);

            return await client.AddQuestionAsync(quiz.Id, kind);
        }

        private static QuestionRequest UpdatedQuestion(QuizKind kind)
        {
            const string imageUrl = "https://example.com/image.png";

            return kind switch
            {
                QuizKind.OpenText => new QuestionRequest("Updated", 60, null, imageUrl, null),
                QuizKind.PollChoice => new QuestionRequest("Updated", 60, null, imageUrl,
                    [new OptionRequest("A", null), new OptionRequest("B", null), new OptionRequest("C", null)]),
                QuizKind.QuizChoice => new QuestionRequest("Updated", 60, 500, imageUrl,
                    [new OptionRequest("A", false), new OptionRequest("B", false), new OptionRequest("C", true)]),
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }

        private static async Task<List<QuestionDto>> GetQuestionsAsync(HttpClient client, int quizId)
        {
            var response = await client.GetAsync(QuestionsUrl(quizId), Ct);
            return await response.ReadAsync<List<QuestionDto>>(HttpStatusCode.OK);
        }

        private static Task<HttpResponseMessage> ReorderAsync(HttpClient client, int quizId, int[] questionIds) =>
            client.PutAsJsonAsync($"{QuestionsUrl(quizId)}/order", new ReorderQuestionsRequest([.. questionIds]), Ct);

        private static async Task<HttpResponseMessage> SendEditAsync(
            HttpClient client, int quizId, QuizKind kind, int questionId, string operation)
        {
            var url = QuestionsUrl(quizId);
            var body = ApiClientExtensions.ValidQuestion(kind);

            return operation switch
            {
                "create" => await client.PostAsJsonAsync(url, body, Ct),
                "update" => await client.PutAsJsonAsync($"{url}/{questionId}", body, Ct),
                "delete" => await client.DeleteAsync($"{url}/{questionId}", Ct),
                "reorder" => await ReorderAsync(client, quizId, [questionId]),
                _ => throw new ArgumentOutOfRangeException(nameof(operation), operation, null)
            };
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

            var end = await host.PostAsync($"/api/games/{game.Id}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, end.StatusCode);
        }
    }
}
