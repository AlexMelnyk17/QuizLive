import { useReducer, useState } from 'react'

import { connectAsPlayer } from '@modules/game/api/gameHubApi'
import {
	GAME_ACTION_TYPES,
	GAME_ERROR_COPY,
	INITIAL_GAME_STATE
} from '@modules/game/constants'
import { useGameHubConnection } from '@modules/game/hooks/useGameHubConnection'
import {
	usePlayerToken,
	usePlayerTokenStore
} from '@modules/game/store/playerTokenStore'
import type {
	PlayerGameInfo,
	PlayerGameResult,
	PlayerQuestionDto
} from '@modules/game/types'
import { gameReducer } from '@modules/game/utils/gameReducer'

// The game as a player sees it: who is in it, where the game is and the running question, which never
// contains the correct option. A player is anonymous: it joins the hub with the token the server gave on
// joining (kept by the player token store) and listens only to the player events. The host's version of
// the question is not subscribed to.
export function usePlayerGame(): PlayerGameResult {
	const playerToken = usePlayerToken()
	const [state, dispatch] = useReducer(
		gameReducer<PlayerQuestionDto>,
		INITIAL_GAME_STATE
	)
	const [player, setPlayer] = useState<PlayerGameInfo | null>(null)

	const { connectionState, error } = useGameHubConnection({
		enabled: playerToken !== null,
		handlers: {
			onPlayerJoined: joined =>
				dispatch({ type: GAME_ACTION_TYPES.playerJoined, player: joined }),
			onQuestionShown: question =>
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
			if (playerToken === null) throw new Error(GAME_ERROR_COPY.notConnected)

			const joined = await connectAsPlayer(hub, playerToken)

			setPlayer({
				gameId: joined.gameId,
				code: joined.code,
				quizTitle: joined.quizTitle,
				playerId: joined.playerId,
				nickname: joined.nickname
			})
			dispatch({
				type: GAME_ACTION_TYPES.snapshot,
				status: joined.status,
				players: joined.players,
				currentQuestion: joined.currentQuestion,
				receivedAtMs: Date.now()
			})
		}
	})

	return {
		hasToken: playerToken !== null,
		player,
		status: state.status,
		players: state.players,
		currentQuestion: state.currentQuestion,
		questionReceivedAtMs: state.questionReceivedAtMs,
		closedQuestionNumber: state.closedQuestionNumber,
		connectionState,
		error,
		leave: usePlayerTokenStore.getState().clearPlayerToken
	}
}
