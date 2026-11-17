import type { HubConnection } from '@microsoft/signalr'

import { GAME_HUB_EVENTS } from '@modules/game/constants'
import {
	closedQuestionNumberSchema,
	gamePlayerDtoSchema,
	hostQuestionDtoSchema,
	playerQuestionDtoSchema
} from '@modules/game/schemas'
import type { GameEventHandlers } from '@modules/game/types'

// Listens to the game events and gives the handlers parsed payloads. It returns a function that stops
// listening. Subscribe before the connection starts, so no event can arrive before the handler exists.
// A payload that does not match its schema throws: that is a broken contract, and SignalR logs it.
export function subscribeToGameEvents(
	connection: HubConnection,
	handlers: GameEventHandlers
): () => void {
	const subscriptions: [string, (payload: unknown) => void][] = [
		[
			GAME_HUB_EVENTS.playerJoined,
			payload => handlers.onPlayerJoined?.(gamePlayerDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.questionShown,
			payload =>
				handlers.onQuestionShown?.(playerQuestionDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.hostQuestionShown,
			payload =>
				handlers.onHostQuestionShown?.(hostQuestionDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.questionClosed,
			payload =>
				handlers.onQuestionClosed?.(closedQuestionNumberSchema.parse(payload))
		],
		[GAME_HUB_EVENTS.gameEnded, () => handlers.onGameEnded?.()]
	]

	for (const [event, handler] of subscriptions) {
		connection.on(event, handler)
	}

	return () => {
		for (const [event, handler] of subscriptions) {
			connection.off(event, handler)
		}
	}
}
