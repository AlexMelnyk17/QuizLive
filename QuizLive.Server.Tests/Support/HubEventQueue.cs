using System.Threading.Channels;
using Microsoft.AspNetCore.SignalR.Client;

namespace QuizLive.Server.Tests.Support
{
    // Collects the events a hub connection receives, so a test waits for an event instead of sleeping.
    public sealed class HubEventQueue<T>
    {
        private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(5);

        private readonly Channel<T> _events = Channel.CreateUnbounded<T>();

        internal void Add(T item) => _events.Writer.TryWrite(item);

        public async Task<T> NextAsync(TimeSpan? timeout = null)
        {
            var testToken = TestContext.Current.CancellationToken;
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(testToken);
            cts.CancelAfter(timeout ?? DefaultTimeout);

            try
            {
                return await _events.Reader.ReadAsync(cts.Token);
            }
            catch (OperationCanceledException) when (!testToken.IsCancellationRequested)
            {
                throw new TimeoutException("The hub event did not arrive in time.");
            }
        }
    }

    public static class HubEventExtensions
    {
        // Subscribe before StartAsync, so no event can arrive before the handler exists.
        public static HubEventQueue<T> Subscribe<T>(this HubConnection connection, string eventName)
        {
            var queue = new HubEventQueue<T>();
            connection.On<T>(eventName, queue.Add);
            return queue;
        }

        // For events without arguments (GameEnded): the queue holds one item per event.
        public static HubEventQueue<bool> Subscribe(this HubConnection connection, string eventName)
        {
            var queue = new HubEventQueue<bool>();
            connection.On(eventName, () => queue.Add(true));
            return queue;
        }
    }
}
