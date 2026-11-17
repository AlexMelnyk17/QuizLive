import type { HubConnection } from '@microsoft/signalr'

type Handler = (...args: unknown[]) => void

// A stand-in for HubConnection: it records the calls, answers them as a test says, and lets a test send
// an event as the server would. It has only what the game module uses.
export class FakeHubConnection {
	readonly invocations: { method: string; args: unknown[] }[] = []

	private readonly results = new Map<string, unknown>()
	private readonly failures = new Map<string, Error>()
	private readonly handlers = new Map<string, Set<Handler>>()

	respondWith(method: string, result: unknown) {
		this.results.set(method, result)
	}

	failWith(method: string, error: Error) {
		this.failures.set(method, error)
	}

	invoke(method: string, ...args: unknown[]): Promise<unknown> {
		this.invocations.push({ method, args })

		const failure = this.failures.get(method)

		return failure
			? Promise.reject(failure)
			: Promise.resolve(this.results.get(method))
	}

	on(event: string, handler: Handler) {
		const handlers = this.handlers.get(event) ?? new Set<Handler>()

		handlers.add(handler)
		this.handlers.set(event, handlers)
	}

	off(event: string, handler: Handler) {
		this.handlers.get(event)?.delete(handler)
	}

	// Sends an event to the handlers, as the server would.
	emit(event: string, ...args: unknown[]) {
		for (const handler of this.handlers.get(event) ?? []) {
			handler(...args)
		}
	}

	handlerCount(event: string): number {
		return this.handlers.get(event)?.size ?? 0
	}

	asHubConnection(): HubConnection {
		return this as unknown as HubConnection
	}
}
