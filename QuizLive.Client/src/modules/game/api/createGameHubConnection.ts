import { HubConnectionBuilder } from '@microsoft/signalr'
import type { HubConnection } from '@microsoft/signalr'

import {
	GAME_HUB_PATH,
	GAME_HUB_RECONNECT_DELAYS_MS
} from '@modules/game/constants'

import { ENV } from '@config/env'

// Builds the connection but does not start it. The host passes a function that gives its JWT: a browser
// WebSocket cannot send an Authorization header, so SignalR sends the token as ?access_token=. A player
// has no JWT and passes nothing: the server lets players in with their player token instead.
export function createGameHubConnection(
	accessTokenFactory?: () => string
): HubConnection {
	return new HubConnectionBuilder()
		.withUrl(`${ENV.VITE_API_BASE_URL}${GAME_HUB_PATH}`, { accessTokenFactory })
		.withAutomaticReconnect([...GAME_HUB_RECONNECT_DELAYS_MS])
		.build()
}
