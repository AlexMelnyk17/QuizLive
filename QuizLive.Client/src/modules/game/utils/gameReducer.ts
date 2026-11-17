import { GAME_ACTION_TYPES, GameStatus } from '@modules/game/constants'
import type { GameAction, GameProgress, GameState } from '@modules/game/types'
import { isStaleSnapshot } from '@modules/game/utils/isStaleSnapshot'
import { mergePlayers } from '@modules/game/utils/mergePlayers'

function progressOf(state: GameState<{ number: number }>): GameProgress {
	return {
		status: state.status,
		questionNumber: state.currentQuestion?.number ?? null
	}
}

// The state of a game on the client, shared by the host and the player (the question type differs).
// Messages come from two sources that are not ordered with respect to each other: the answer to
// ConnectAs* and the events. So every message is compared with what is already known, and an older one
// is ignored. Players are the exception: they only join, so they are always merged.
export function gameReducer<TQuestion extends { number: number }>(
	state: GameState<TQuestion>,
	action: GameAction<TQuestion>
): GameState<TQuestion> {
	switch (action.type) {
		case GAME_ACTION_TYPES.snapshot: {
			const players = mergePlayers(state.players, action.players)
			const snapshot: GameProgress = {
				status: action.status,
				questionNumber: action.currentQuestion?.number ?? null
			}

			if (isStaleSnapshot(progressOf(state), snapshot)) {
				return { ...state, players }
			}

			return {
				status: action.status,
				players,
				currentQuestion: action.currentQuestion,
				questionReceivedAtMs: action.currentQuestion
					? action.receivedAtMs
					: null,
				// A snapshot taken while the results are shown says which question was closed.
				closedQuestionNumber:
					action.status === GameStatus.Results
						? (action.currentQuestion?.number ?? null)
						: null
			}
		}

		case GAME_ACTION_TYPES.playerJoined:
			return { ...state, players: mergePlayers(state.players, [action.player]) }

		case GAME_ACTION_TYPES.questionShown: {
			const shown: GameProgress = {
				status: GameStatus.Question,
				questionNumber: action.question.number
			}

			if (isStaleSnapshot(progressOf(state), shown)) return state

			return {
				...state,
				status: GameStatus.Question,
				currentQuestion: action.question,
				questionReceivedAtMs: action.receivedAtMs,
				closedQuestionNumber: null
			}
		}

		case GAME_ACTION_TYPES.questionClosed: {
			const closed: GameProgress = {
				status: GameStatus.Results,
				questionNumber: action.number
			}

			if (isStaleSnapshot(progressOf(state), closed)) return state

			return {
				...state,
				status: GameStatus.Results,
				closedQuestionNumber: action.number
			}
		}

		case GAME_ACTION_TYPES.gameEnded:
			return { ...state, status: GameStatus.Finished }

		default: {
			const unreachable: never = action

			return unreachable
		}
	}
}
