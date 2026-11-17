using Microsoft.Extensions.DependencyInjection;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Exceptions;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Core.Enums;
using QuizLive.Server.Tests.Support;

namespace QuizLive.Server.Tests.Games
{
    // What the service sends after each transition, recorded by the fake notifier.
    // Who actually receives it is checked with real connections in GameHubEventTests.
    public class GameFlowEventsTests(QuizLiveFactory factory) : IClassFixture<QuizLiveFactory>
    {
        [Fact]
        public async Task Start_SendsTheQuestionToBothAudiences()
        {
            var (host, hostId, game) = await LobbyAsync(QuizKind.QuizChoice, questionCount: 1);

            await Flow(f => f.StartAsync(game.Id, hostId));

            var shown = Assert.Single(EventsOf(game.Id, nameof(IGameClient.QuestionShown)));
            Assert.Equal(1, shown.Views!.ForPlayers.Number);
            Assert.Equal(1, shown.Views.ForHost.Number);
            Assert.Single(shown.Views.ForHost.Question.Options!, option => option.IsCorrect == true);
        }

        [Fact]
        public async Task ShowResults_SendsTheNumberOfTheClosedQuestion()
        {
            var (_, hostId, game) = await LobbyAsync(QuizKind.OpenText, questionCount: 2);
            await Flow(f => f.StartAsync(game.Id, hostId));

            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            var closed = Assert.Single(EventsOf(game.Id, nameof(IGameClient.QuestionClosed)));
            Assert.Equal(1, closed.Number);
        }

        [Fact]
        public async Task NextQuestion_SendsTheNextQuestion_AndTheLastOneEndsTheGame()
        {
            var (_, hostId, game) = await LobbyAsync(QuizKind.OpenText, questionCount: 2);
            await Flow(f => f.StartAsync(game.Id, hostId));
            await Flow(f => f.ShowResultsAsync(game.Id, hostId));

            await Flow(f => f.NextQuestionAsync(game.Id, hostId));

            var shown = EventsOf(game.Id, nameof(IGameClient.QuestionShown));
            Assert.Equal([1, 2], shown.Select(e => e.Views!.ForPlayers.Number));
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.GameEnded)));

            await Flow(f => f.ShowResultsAsync(game.Id, hostId));
            await Flow(f => f.NextQuestionAsync(game.Id, hostId));

            Assert.Single(EventsOf(game.Id, nameof(IGameClient.GameEnded)));
        }

        [Fact]
        public async Task End_SendsGameEndedOnce_EvenWhenCalledTwice()
        {
            var (_, hostId, game) = await LobbyAsync(QuizKind.OpenText, questionCount: 1);

            await Flow(f => f.EndAsync(game.Id, hostId));
            await Flow(f => f.EndAsync(game.Id, hostId));

            Assert.Single(EventsOf(game.Id, nameof(IGameClient.GameEnded)));
        }

        [Fact]
        public async Task ARejectedCommand_SendsNothing()
        {
            var (_, hostId, game) = await LobbyAsync(QuizKind.OpenText, questionCount: 1);

            await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.ShowResultsAsync(game.Id, hostId)));
            await Assert.ThrowsAsync<ConflictException>(() => Flow(f => f.NextQuestionAsync(game.Id, hostId)));

            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionShown)));
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.QuestionClosed)));
            Assert.Empty(EventsOf(game.Id, nameof(IGameClient.GameEnded)));
        }

        private IReadOnlyList<GameEvent> EventsOf(int gameId, string name) =>
            factory.Notifier.EventsFor(gameId).Where(e => e.Name == name).ToList();

        private async Task<(HttpClient Host, string HostId, GameDto Game)> LobbyAsync(QuizKind kind, int questionCount)
        {
            var (host, hostId) = await factory.CreateHostAsync();
            var quiz = await host.CreateQuizAsync(kind);

            for (var i = 0; i < questionCount; i++)
            {
                await host.AddQuestionAsync(quiz.Id, kind);
            }

            var game = await host.CreateGameAsync(quiz.Id);
            await host.JoinAsync(game.Code, "Ann");
            return (host, hostId, game);
        }

        private async Task<T> Flow<T>(Func<IGameFlowService, Task<T>> action)
        {
            using var scope = factory.Services.CreateScope();
            return await action(scope.ServiceProvider.GetRequiredService<IGameFlowService>());
        }
    }
}
