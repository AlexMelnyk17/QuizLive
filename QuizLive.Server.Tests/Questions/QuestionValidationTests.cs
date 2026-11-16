using System.Net;
using System.Net.Http.Json;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Questions
{
    // Rules of POST /api/quizzes/{quizId}/questions. PUT uses the same validation.
    public class QuestionValidationTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static TheoryData<string> InvalidTexts => new() { "", "   ", new string('a', 1001) };

        public static TheoryData<string> InvalidImageUrls => new()
        {
            "javascript:alert(1)",
            "data:image/png;base64,AAAA",
            "ftp://example.com/image.png",
            "file:///C:/image.png",
            "example.com/image.png",
            $"https://example.com/{new string('a', 500)}.png"
        };

        [Fact]
        public async Task OpenText_WithOptions_Returns400()
        {
            var request = Question(QuizKind.OpenText) with { Options = [new OptionRequest("A", null), new OptionRequest("B", null)] };

            var response = await PostQuestionAsync(QuizKind.OpenText, request);

            await AssertErrorAsync(response, "options", QuestionMessages.OpenTextHasNoOptions);
        }

        [Theory]
        [InlineData(QuizKind.PollChoice, 0)]
        [InlineData(QuizKind.PollChoice, 1)]
        [InlineData(QuizKind.QuizChoice, 0)]
        [InlineData(QuizKind.QuizChoice, 1)]
        public async Task Choice_WithFewerThanTwoOptions_Returns400(QuizKind kind, int count)
        {
            var request = Question(kind) with { Options = Options(kind, count) };

            var response = await PostQuestionAsync(kind, request);

            await AssertErrorAsync(response, "options", QuestionMessages.MinOptions(2));
        }

        [Theory]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task Choice_WithMoreThanTenOptions_Returns400(QuizKind kind)
        {
            var request = Question(kind) with { Options = Options(kind, 11) };

            var response = await PostQuestionAsync(kind, request);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "options");
        }

        [Theory]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task Choice_WithTenOptions_Returns201(QuizKind kind)
        {
            var response = await PostQuestionAsync(kind, Question(kind) with { Options = Options(kind, 10) });

            var question = await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            Assert.Equal(10, question.Options?.Count);
        }

        [Theory]
        [InlineData(QuizKind.PollChoice)]
        [InlineData(QuizKind.QuizChoice)]
        public async Task Choice_WithEmptyOptionText_Returns400(QuizKind kind)
        {
            var options = Options(kind, 2);
            options[1] = options[1] with { Text = "" };

            var response = await PostQuestionAsync(kind, Question(kind) with { Options = options });

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "options[1].text");
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task PollChoice_WithIsCorrect_Returns400(bool isCorrect)
        {
            var request = Question(QuizKind.PollChoice) with
            {
                Options = [new OptionRequest("Tea", null), new OptionRequest("Coffee", isCorrect)]
            };

            var response = await PostQuestionAsync(QuizKind.PollChoice, request);

            await AssertErrorAsync(response, "options[1].isCorrect", QuestionMessages.PollHasNoCorrectOption);
        }

        [Fact]
        public async Task QuizChoice_WithoutIsCorrect_Returns400()
        {
            var request = Question(QuizKind.QuizChoice) with
            {
                Options = [new OptionRequest("4", true), new OptionRequest("5", null)]
            };

            var response = await PostQuestionAsync(QuizKind.QuizChoice, request);

            await AssertErrorAsync(response, "options[1].isCorrect", QuestionMessages.IsCorrectRequired);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(2)]
        public async Task QuizChoice_WithoutExactlyOneCorrectOption_Returns400(int correctCount)
        {
            var options = Enumerable.Range(0, 3)
                .Select(i => new OptionRequest($"Option {i + 1}", i < correctCount))
                .ToList();

            var response = await PostQuestionAsync(QuizKind.QuizChoice, Question(QuizKind.QuizChoice) with { Options = options });

            await AssertErrorAsync(response, "options", QuestionMessages.ExactlyOneCorrect);
        }

        [Theory]
        [InlineData(QuizKind.OpenText)]
        [InlineData(QuizKind.PollChoice)]
        public async Task BasePoints_OutsideQuizChoice_Returns400(QuizKind kind)
        {
            var response = await PostQuestionAsync(kind, Question(kind) with { BasePoints = 100 });

            await AssertErrorAsync(response, "basePoints", QuestionMessages.PointsOnlyInQuizChoice);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(10001)]
        public async Task QuizChoice_WithBasePointsOutOfRange_Returns400(int points)
        {
            var response = await PostQuestionAsync(QuizKind.QuizChoice, Question(QuizKind.QuizChoice) with { BasePoints = points });

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "basePoints");
        }

        [Theory]
        [InlineData(0)]
        [InlineData(10000)]
        [InlineData(null)]
        public async Task QuizChoice_WithBasePointsInRange_Returns201(int? points)
        {
            var response = await PostQuestionAsync(QuizKind.QuizChoice, Question(QuizKind.QuizChoice) with { BasePoints = points });

            var question = await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            Assert.Equal(points, question.BasePoints);
        }

        [Theory]
        [InlineData(4)]
        [InlineData(301)]
        public async Task TimeLimit_OutOfRange_Returns400(int seconds)
        {
            var response = await PostQuestionAsync(QuizKind.OpenText, Question(QuizKind.OpenText) with { TimeLimitSeconds = seconds });

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "timeLimitSeconds");
        }

        [Theory]
        [InlineData(5)]
        [InlineData(300)]
        [InlineData(null)]
        public async Task TimeLimit_InRange_Returns201(int? seconds)
        {
            var response = await PostQuestionAsync(QuizKind.OpenText, Question(QuizKind.OpenText) with { TimeLimitSeconds = seconds });

            var question = await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            Assert.Equal(seconds, question.TimeLimitSeconds);
        }

        [Theory]
        [MemberData(nameof(InvalidTexts))]
        public async Task Text_Invalid_Returns400(string text)
        {
            var response = await PostQuestionAsync(QuizKind.OpenText, Question(QuizKind.OpenText) with { Text = text });

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "text");
        }

        [Theory]
        [MemberData(nameof(InvalidImageUrls))]
        public async Task ImageUrl_NotAbsoluteHttpLink_Returns400(string imageUrl)
        {
            var response = await PostQuestionAsync(QuizKind.OpenText, Question(QuizKind.OpenText) with { ImageUrl = imageUrl });

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "imageUrl");
        }

        [Theory]
        [InlineData("https://example.com/image.png", "https://example.com/image.png")]
        [InlineData("  http://example.com/image.png  ", "http://example.com/image.png")]
        [InlineData("   ", null)]
        public async Task ImageUrl_Valid_IsStoredTrimmed(string imageUrl, string? expected)
        {
            var response = await PostQuestionAsync(QuizKind.OpenText, Question(QuizKind.OpenText) with { ImageUrl = imageUrl });

            var question = await response.ReadAsync<QuestionDto>(HttpStatusCode.Created);
            Assert.Equal(expected, question.ImageUrl);
        }

        private static QuestionRequest Question(QuizKind kind) => ApiClientExtensions.ValidQuestion(kind);

        // For quiz choice the first option is the correct one.
        private static List<OptionRequest> Options(QuizKind kind, int count) =>
            Enumerable.Range(0, count)
                .Select(i => new OptionRequest($"Option {i + 1}", kind == QuizKind.QuizChoice ? i == 0 : null))
                .ToList();

        private async Task<HttpResponseMessage> PostQuestionAsync(QuizKind kind, QuestionRequest request)
        {
            var client = await factory.CreateAuthorizedClientAsync();
            var quiz = await client.CreateQuizAsync(kind);

            return await client.PostAsJsonAsync($"/api/quizzes/{quiz.Id}/questions", request, Ct);
        }

        private static async Task AssertErrorAsync(HttpResponseMessage response, string key, string message)
        {
            var problem = await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, key);
            Assert.Contains(message, problem.Errors[key]);
        }
    }
}
