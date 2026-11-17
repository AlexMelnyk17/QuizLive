import type { HubConnection } from '@microsoft/signalr'
import { useCallback, useMemo, useReducer, useState } from 'react'

import { readSession } from '@modules/auth/store/sessionStore'
import {
	addTime,
	connectAsHost,
	endGame,
	nextQuestion,
	showResults,
	startGame
} from '@modules/game/api/gameHubApi'
import {
	GAME_ACTION_TYPES,
	GAME_CONNECTION_STATE,
	GAME_ERROR_COPY,
	INITIAL_GAME_STATE
} from '@modules/game/constants'
import { useGameHubConnection } from '@modules/game/hooks/useGameHubConnection'
import type {
	HostGameCommands,
	HostGameInfo,
	HostGameResult,
	HostQuestionDto
} from '@modules/game/types'
import { gameReducer } from '@modules/game/utils/gameReducer'
import { getHubErrorMessage } from '@modules/game/utils/getHubErrorMessage'

// The game as the host sees it: who has joined, where the game is, the running question (with the correct
// option) and the commands that drive the game. The host does not play, so it joins with its JWT and
// listens only to the host events. Use it in a component keyed by the game id: it joins the game it was
// mounted with, so a different game needs a new mount.
export function useHostGame(gameId: number): HostGameResult {
	const [state, dispatch] = useReducer(
		gameReducer<HostQuestionDto>,
		INITIAL_GAME_STATE
	)
	const [game, setGame] = useState<HostGameInfo | null>(null)

	const { connection, connectionState, error } = useGameHubConnection({
		enabled: Number.isInteger(gameId) && gameId > 0,
		accessTokenFactory: () => readSession()?.token ?? '',
		handlers: {
			onTimeAdded: payload =>
				dispatch({
					type: GAME_ACTION_TYPES.timeAdded,
					...payload,
					receivedAtMs: Date.now()
				}),
			onPlayerJoined: player =>
				dispatch({ type: GAME_ACTION_TYPES.playerJoined, player }),
			onHostQuestionShown: question =>
				dispatch({
					type: GAME_ACTION_TYPES.questionShown,
					question,
					receivedAtMs: Date.now()
				}),
			onQuestionClosed: number =>
				dispatch({ type: GAME_ACTION_TYPES.questionClosed, number }),
			onGameEnded: () => dispatch({ type: GAME_ACTION_TYPES.gameEnded })
		},
		// Runs after the start and after every reconnect; the reducer ignores a snapshot that is older
		// than what the events have already told.
		join: async hub => {
			const joined = await connectAsHost(hub, gameId)

			setGame({
				id: joined.game.id,
				code: joined.game.code,
				quizId: joined.game.quizId,
				quizTitle: joined.game.quizTitle,
				quizKind: joined.game.quizKind
			})
			dispatch({
				type: GAME_ACTION_TYPES.snapshot,
				status: joined.game.status,
				players: joined.game.players,
				currentQuestion: joined.currentQuestion,
				receivedAtMs: Date.now()
			})
		}
	})

	const send = useCallback(
		async (command: (hub: HubConnection) => Promise<void>) => {
			if (!connection || connectionState !== GAME_CONNECTION_STATE.connected)
				return GAME_ERROR_COPY.notConnected

			try {
				await command(connection)
			} catch (commandError) {
				return getHubErrorMessage(commandError)
			}

			return null
		},
		[connection, connectionState]
	)

	const commands = useMemo<HostGameCommands>(
		() => ({
			addTime: seconds => send(hub => addTime(hub, seconds)),
			startGame: () => send(startGame),
			showResults: () => send(showResults),
			nextQuestion: () => send(nextQuestion),
			endGame: () => send(endGame)
		}),
		[send]
	)

	return {
		game,
		status: state.status,
		players: state.players,
		currentQuestion: state.currentQuestion,
		questionReceivedAtMs: state.questionReceivedAtMs,
		closedQuestionNumber: state.closedQuestionNumber,
		connectionState,
		error,
		commands
	}
}
