namespace QuizLive.Server.API.Hubs
{
    // What a hub connection is in its game. Host commands must check it: the game id alone
    // does not tell a host connection from a player one.
    public enum ConnectionRole
    {
        Host,
        Player
    }
}
