import { HubConnectionState } from '@microsoft/signalr'
import { describe, expect, it, vi } from 'vitest'

import { createGameHubConnection } from '@modules/game/api/createGameHubConnection'

// SignalR resolves a relative URL such as "/api" only in a real browser: it takes Vitest for Node, even
// with jsdom. So the test gives a full base URL; in the app the base URL is "/api" and the browser resolves it.
vi.mock('@config/env', () => ({
	ENV: { VITE_API_BASE_URL: 'http://localhost:7118/api' }
}))

describe('createGameHubConnection', () => {
	it('points at the game hub under the API base URL', () => {
		const connection = createGameHubConnection()

		expect(connection.baseUrl).toBe('http://localhost:7118/api/hubs/game')
	})

	it('does not start the connection', () => {
		const connection = createGameHubConnection(() => 'jwt')

		expect(connection.state).toBe(HubConnectionState.Disconnected)
	})
})
