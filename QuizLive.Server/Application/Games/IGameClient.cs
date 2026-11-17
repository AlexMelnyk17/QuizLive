namespace QuizLive.Server.Application.Games
{
    // Method names are the event names the JS client subscribes to.
    public interface IGameClient
    {
        Task PlayerJoined(GamePlayerDto player);

        // The running question for the players: no IsCorrect.
        Task QuestionShown(PlayerQuestionDto question);

        // The same question for the host, in the author version. A separate method, because one method has
        // one payload type; each connection receives only the one that matches its group.
        Task HostQuestionShown(HostQuestionDto question);

        // The question with this number was closed: the game is now showing its results.
        Task QuestionClosed(int number);

        Task GameEnded();
    }
}
