namespace QuizLive.Server.Tests.Support
{
    // The same test host, but the real SignalRGameNotifier sends events to connected hub clients.
    public class RealtimeQuizLiveFactory : QuizLiveFactory
    {
        protected override bool UseFakeNotifier => false;
    }
}
