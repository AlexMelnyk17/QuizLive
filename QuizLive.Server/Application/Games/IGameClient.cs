namespace QuizLive.Server.Application.Games
{
    // Method names are the event names the JS client subscribes to.
    public interface IGameClient
    {
        Task PlayerJoined(GamePlayerDto player);
        Task GameEnded();
    }
}
