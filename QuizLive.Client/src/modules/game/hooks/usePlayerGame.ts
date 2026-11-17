import { useReducer, useRef, useState } from 'react'

import {
	connectAsPlayer,
	submitAnswer as sendAnswer
} from '@modules/game/api/gameHubApi'
import {
	GAME_ACTION_TYPES,
	GAME_CONNECTION_STATE,
	GAME_ERROR_COPY,
	GameStatus,
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
	PlayerQuestionDto,
	SubmitAnswerRequest
} from '@modules/game/types'
import { gameReducer } from '@modules/game/utils/gameReducer'
import { getHubErrorMessage } from '@modules/game/utils/getHubErrorMessage'
import { getRemainingMs } from '@modules/game/utils/getRemainingMs'

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
	const [answers, setAnswers] = useState<
		Map<number, SubmitAnswerRequest | null>
	>(() => new Map())
	const [pendingQuestion, setPendingQuestion] = useState<number | null>(null)
	const sending = useRef(false)

	const { connection, connectionState, error } = useGameHubConnection({
		enabled: playerToken !== null,
		handlers: {
			onTimeAdded: payload =>
				dispatch({
					type: GAME_ACTION_TYPES.timeAdded,
					...payload,
					receivedAtMs: Date.now()
				}),
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
			// A late snapshot must never erase an acknowledgement received in this session.
			if (joined.hasAnswered && joined.currentQuestion) {
				const number = joined.currentQuestion.number
				const saved = joined.currentAnswer
				const answer = saved
					? {
							questionNumber: number,
							...(saved.optionId != null ? { optionId: saved.optionId } : {}),
							...(saved.text != null ? { text: saved.text } : {})
						}
					: null
				setAnswers(previous => new Map(previous).set(number, answer))
			}

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

	async function submitAnswer(
		answer: SubmitAnswerRequest
	): Promise<string | null> {
		if (!connection || connectionState !== GAME_CONNECTION_STATE.connected)
			return GAME_ERROR_COPY.notConnected
		if (sending.current) return null
		if (
			state.status !== GameStatus.Question ||
			state.currentQuestion?.number !== answer.questionNumber
		)
			return GAME_ERROR_COPY.generic
		const remaining =
			state.questionReceivedAtMs === null
				? null
				: getRemainingMs(
						state.currentQuestion.timing,
						state.questionReceivedAtMs,
						Date.now()
					)
		if (remaining !== null && remaining <= 0) return GAME_ERROR_COPY.generic
		sending.current = true
		setPendingQuestion(answer.questionNumber)
		try {
			await sendAnswer(connection, answer)
			setAnswers(previous =>
				new Map(previous).set(answer.questionNumber, answer)
			)
			return null
		} catch (submissionError) {
			return getHubErrorMessage(submissionError)
		} finally {
			sending.current = false
			setPendingQuestion(null)
		}
	}

	return {
		selectedAnswer: state.currentQuestion
			? (answers.get(state.currentQuestion.number) ?? null)
			: null,
		hasAnswered:
			state.currentQuestion !== null &&
			answers.has(state.currentQuestion.number),
		isSubmitting:
			pendingQuestion !== null &&
			pendingQuestion === state.currentQuestion?.number,
		submitAnswer,
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
