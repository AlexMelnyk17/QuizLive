using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    public class GameLobbyTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        private static CancellationToken Ct => TestContext.Current.CancellationToken;

        public static TheoryData<string> InvalidNicknames => new() { "", "   ", new string('a', 41) };

        [Fact]
        public async Task Create_ReturnsLobbyWithSixDigitCode()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.PollChoice, "History");
            await host.AddQuestionAsync(quiz.Id, QuizKind.PollChoice);

            var response = await PostGameAsync(host, quiz.Id);
            var game = await response.ReadAsync<GameDto>(HttpStatusCode.Created);

            Assert.Matches("^[0-9]{6}$", game.Code);
            Assert.Equal(GameStatus.Lobby, game.Status);
            Assert.Equal(quiz.Id, game.QuizId);
            Assert.Equal("History", game.QuizTitle);
            Assert.Equal(QuizKind.PollChoice, game.QuizKind);
            Assert.Null(game.EndedAtUtc);
            Assert.Empty(game.Players);
            Assert.Equal($"/api/games/{game.Id}", response.Headers.Location?.AbsolutePath);
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public async Task Create_ForMissingOrAnotherUsersQuiz_Returns404(bool quizExists)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quizId = quizExists
                ? (await (await factory.CreateAuthorizedClientAsync()).CreatePlayableQuizAsync(QuizKind.OpenText)).Id
                : int.MaxValue;

            var response = await PostGameAsync(host, quizId);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal(QuizMessages.NotFound(quizId), problem.Detail);
        }

        [Fact]
        public async Task Create_ForArchivedQuiz_Returns409()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);
            var archive = await host.PostAsync($"/api/quizzes/{quiz.Id}/archive", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

            var response = await PostGameAsync(host, quiz.Id);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal("An archived quiz cannot be started.", problem.Detail);
        }

        [Fact]
        public async Task Create_ForQuizWithoutQuestions_Returns409()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreateQuizAsync(QuizKind.OpenText);

            var response = await PostGameAsync(host, quiz.Id);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal("The quiz has no questions.", problem.Detail);
        }

        [Fact]
        public async Task GetById_ReturnsPlayersInJoinOrder()
        {
            var (host, game) = await CreateGameAsync();
            var anna = await factory.CreateClient().JoinAsync(game.Code, "Anna");
            var bohdan = await factory.CreateClient().JoinAsync(game.Code, "Bohdan");

            var loaded = await GetGameAsync(host, game.Id);

            Assert.Equal(game.Code, loaded.Code);
            Assert.Equal(new[] { anna.PlayerId, bohdan.PlayerId }, loaded.Players.Select(p => p.Id));
            Assert.Equal(new[] { "Anna", "Bohdan" }, loaded.Players.Select(p => p.Nickname));
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public async Task GetById_ForMissingOrAnotherHostsGame_Returns404(bool gameExists)
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var gameId = gameExists ? (await CreateGameAsync()).Game.Id : int.MaxValue;

            var response = await host.GetAsync($"/api/games/{gameId}", Ct);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal($"Game {gameId} was not found.", problem.Detail);
        }

        [Theory]
        [InlineData("{0}")]
        [InlineData("  {0}  ")]
        public async Task GetByCode_ReturnsPublicInfo(string codeFormat)
        {
            var (_, game) = await CreateGameAsync();

            var response = await GetByCodeAsync(factory.CreateClient(), string.Format(codeFormat, game.Code));
            var lookup = await response.ReadAsync<GameLookupDto>(HttpStatusCode.OK);

            Assert.Equal(new GameLookupDto(game.Code, game.QuizTitle, GameStatus.Lobby), lookup);
        }

        [Fact]
        public async Task GetByCode_ForEndedGame_Returns404()
        {
            var (host, game) = await CreateGameAsync();
            await EndGameAsync(host, game.Id);

            var response = await GetByCodeAsync(factory.CreateClient(), game.Code);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal($"Game with code {game.Code} was not found.", problem.Detail);
        }

        [Fact]
        public async Task Join_ReturnsUniqueTokenAndNotifiesHost()
        {
            var (host, game) = await CreateGameAsync();

            var anna = await factory.CreateClient().JoinAsync(game.Code, "  Anna  ");
            var bohdan = await factory.CreateClient().JoinAsync(game.Code, "Bohdan");

            Assert.Equal(game.Id, anna.GameId);
            Assert.Equal("Anna", anna.Nickname);
            Assert.False(string.IsNullOrEmpty(anna.Token));
            Assert.NotEqual(anna.Token, bohdan.Token);

            var events = factory.Notifier.EventsFor(game.Id);
            Assert.Equal(new int?[] { anna.PlayerId, bohdan.PlayerId }, events.Select(e => e.Player?.Id));
            Assert.All(events, e => Assert.Equal(nameof(IGameClient.PlayerJoined), e.Name));
            Assert.Equal("Anna", events[0].Player?.Nickname);

            // The host view lists players but never their tokens.
            var hostView = await host.GetStringAsync($"/api/games/{game.Id}", Ct);
            Assert.DoesNotContain(anna.Token, hostView);
        }

        [Fact]
        public async Task Join_WithFortyCharacterNickname_Returns201()
        {
            var (_, game) = await CreateGameAsync();
            var nickname = new string('a', 40);

            var player = await factory.CreateClient().JoinAsync(game.Code, nickname);

            Assert.Equal(nickname, player.Nickname);
        }

        [Theory]
        [InlineData("Anna", "Anna")]
        [InlineData("Anna", "aNNA")]
        [InlineData("Anna", "  Anna  ")]
        [InlineData("Олег", "олег")]
        [InlineData("олег", "ОЛЕГ")]
        public async Task Join_WithTakenNickname_Returns409(string taken, string nickname)
        {
            var (_, game) = await CreateGameAsync();
            await factory.CreateClient().JoinAsync(game.Code, taken);

            var response = await PostJoinAsync(game.Code, nickname);

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal($"The nickname \"{nickname.Trim()}\" is already taken in this game.", problem.Detail);
            Assert.Single(factory.Notifier.EventsFor(game.Id));
        }

        [Theory]
        [MemberData(nameof(InvalidNicknames))]
        public async Task Join_WithInvalidNickname_Returns400(string nickname)
        {
            var (_, game) = await CreateGameAsync();

            var response = await PostJoinAsync(game.Code, nickname);

            await ProblemAssert.HasErrorAsync(response, HttpStatusCode.BadRequest, "nickname");
        }

        [Fact]
        public async Task Join_WhenGameIsNotInLobby_Returns409()
        {
            var (_, game) = await CreateGameAsync();
            await ShowFirstQuestionAsync(game.Id);

            var response = await PostJoinAsync(game.Code, "Late");

            var problem = await ProblemAssert.HasStatusAsync(response, HttpStatusCode.Conflict);
            Assert.Equal("The game has already started.", problem.Detail);
        }

        [Fact]
        public async Task Join_EndedGame_Returns404()
        {
            var (host, game) = await CreateGameAsync();
            await EndGameAsync(host, game.Id);

            var response = await PostJoinAsync(game.Code, "Late");

            await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task End_Twice_EndsGameOnceAndFreesCode()
        {
            var (host, game) = await CreateGameAsync();

            await EndGameAsync(host, game.Id);
            await EndGameAsync(host, game.Id);

            var ended = await GetGameAsync(host, game.Id);
            Assert.Equal(GameStatus.Finished, ended.Status);
            Assert.NotNull(ended.EndedAtUtc);

            var gameEnded = Assert.Single(factory.Notifier.EventsFor(game.Id), e => e.Name == nameof(IGameClient.GameEnded));
            Assert.Equal(nameof(IGameClient.GameEnded), gameEnded.Name);

            var lookup = await GetByCodeAsync(factory.CreateClient(), game.Code);
            Assert.Equal(HttpStatusCode.NotFound, lookup.StatusCode);
        }

        [Fact]
        public async Task End_AnotherHostsGame_Returns404AndKeepsGameActive()
        {
            var (host, game) = await CreateGameAsync();
            var stranger = await factory.CreateAuthorizedClientAsync();

            var response = await stranger.PostAsync($"/api/games/{game.Id}/end", null, Ct);

            await ProblemAssert.HasStatusAsync(response, HttpStatusCode.NotFound);
            Assert.Equal(GameStatus.Lobby, (await GetGameAsync(host, game.Id)).Status);
            Assert.Empty(factory.Notifier.EventsFor(game.Id));
        }

        private async Task<(HttpClient Host, GameDto Game)> CreateGameAsync()
        {
            var host = await factory.CreateAuthorizedClientAsync();
            var quiz = await host.CreatePlayableQuizAsync(QuizKind.QuizChoice);

            return (host, await host.CreateGameAsync(quiz.Id));
        }

        private static Task<HttpResponseMessage> PostGameAsync(HttpClient host, int quizId) =>
            host.PostAsJsonAsync("/api/games", new CreateGameRequest(quizId), Ct);

        private static async Task<GameDto> GetGameAsync(HttpClient host, int gameId)
        {
            var response = await host.GetAsync($"/api/games/{gameId}", Ct);
            return await response.ReadAsync<GameDto>(HttpStatusCode.OK);
        }

        private static Task<HttpResponseMessage> GetByCodeAsync(HttpClient client, string code) =>
            client.GetAsync($"/api/games/code/{Uri.EscapeDataString(code)}", Ct);

        private Task<HttpResponseMessage> PostJoinAsync(string code, string nickname) =>
            factory.CreateClient().PostAsJsonAsync($"/api/games/code/{code}/players", new JoinGameRequest(nickname), Ct);

        private static async Task EndGameAsync(HttpClient host, int gameId)
        {
            var response = await host.PostAsync($"/api/games/{gameId}/end", null, Ct);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        // No endpoint starts a game yet, so the status is set directly.
        private async Task ShowFirstQuestionAsync(int gameId)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var game = await db.GameSessionRecords.SingleAsync(g => g.Id == gameId, Ct);
            var now = DateTime.UtcNow;

            game.Status = GameStatus.Question;
            game.StartedAtUtc = now;
            game.CurrentQuestionOrder = 1;
            game.CurrentQuestionStartedAtUtc = now;

            await db.SaveChangesAsync(Ct);
        }
    }
}
