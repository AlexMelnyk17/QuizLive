import type { HubConnection } from '@microsoft/signalr'

import { GAME_HUB_METHODS } from '@modules/game/constants'
import {
	hostGameStateDtoSchema,
	playerGameStateDtoSchema
} from '@modules/game/schemas'
import type {
	HostGameStateDto,
	PlayerGameStateDto,
	SubmitAnswerRequest
} from '@modules/game/types'

// The hub methods, one function each, like the endpoints in a *Api.ts file. A hub error is not caught here:
// it is a HubException whose message is the readable text from the server.

export async function connectAsHost(
	connection: HubConnection,
	gameId: number
): Promise<HostGameStateDto> {
	const data: unknown = await connection.invoke(
		GAME_HUB_METHODS.connectAsHost,
		gameId
	)

	return hostGameStateDtoSchema.parse(data)
}

export async function connectAsPlayer(
	connection: HubConnection,
	playerToken: string
): Promise<PlayerGameStateDto> {
	const data: unknown = await connection.invoke(
		GAME_HUB_METHODS.connectAsPlayer,
		playerToken
	)

	return playerGameStateDtoSchema.parse(data)
}

// The host's commands act on the game this connection joined; their result arrives as an event.

export async function startGame(connection: HubConnection): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.startGame)
}

export async function showResults(connection: HubConnection): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.showResults)
}

export async function nextQuestion(connection: HubConnection): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.nextQuestion)
}

export async function endGame(connection: HubConnection): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.endGame)
}

export async function submitAnswer(
	connection: HubConnection,
	answer: SubmitAnswerRequest
): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.submitAnswer, answer)
}
export async function addTime(
	connection: HubConnection,
	seconds: number
): Promise<void> {
	await connection.invoke(GAME_HUB_METHODS.addTime, seconds)
}
