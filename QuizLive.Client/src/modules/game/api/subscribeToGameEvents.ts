import type { HubConnection } from '@microsoft/signalr'
import { z } from 'zod'

import { GAME_HUB_EVENTS } from '@modules/game/constants'
import {
	answerProgressDtoSchema,
	closedQuestionNumberSchema,
	gamePlayerDtoSchema,
	hostQuestionDtoSchema,
	hostResultsDtoSchema,
	leaderboardDtoSchema,
	playerPresenceDtoSchema,
	playerQuestionDtoSchema,
	playerResultsDtoSchema,
	questionTimeAddedDtoSchema
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
			GAME_HUB_EVENTS.answerProgress,
			payload =>
				handlers.onAnswerProgress?.(answerProgressDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.hostResults,
			payload => handlers.onHostResults?.(hostResultsDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.playerResults,
			payload =>
				handlers.onPlayerResults?.(playerResultsDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.leaderboard,
			payload => handlers.onLeaderboard?.(leaderboardDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.timeAdded,
			payload =>
				handlers.onTimeAdded?.(questionTimeAddedDtoSchema.parse(payload))
		],
		[
			GAME_HUB_EVENTS.playerPresenceChanged,
			payload =>
				handlers.onPlayerPresenceChanged?.(
					playerPresenceDtoSchema.parse(payload)
				)
		],
		[
			GAME_HUB_EVENTS.playerLeft,
			payload => handlers.onPlayerLeft?.(z.number().parse(payload))
		],
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
