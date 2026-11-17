import { describe, expect, it } from 'vitest'

import {
	GAME_ACTION_TYPES,
	GameStatus,
	INITIAL_GAME_STATE
} from '@modules/game/constants'
import type {
	GameAction,
	GamePlayerDto,
	GameState,
	PlayerQuestionDto
} from '@modules/game/types'
import { gameReducer } from '@modules/game/utils/gameReducer'

type PlayerAction = GameAction<PlayerQuestionDto>
type PlayerState = GameState<PlayerQuestionDto>

const initial: PlayerState = INITIAL_GAME_STATE

function player(id: number): GamePlayerDto {
	return { id, nickname: `Player ${id}`, joinedAtUtc: '2026-11-17T10:00:00Z' }
}

function question(number: number): PlayerQuestionDto {
	return {
		number,
		total: 3,
		text: `Question ${number}`,
		imageUrl: null,
		timeLimitSeconds: 30,
		options: null,
		timing: {
			startedAtUtc: '2026-11-17T10:00:00Z',
			endsAtUtc: '2026-11-17T10:00:30Z',
			serverNowUtc: '2026-11-17T10:00:01Z'
		}
	}
}

const joined = (id: number): PlayerAction => ({
	type: GAME_ACTION_TYPES.playerJoined,
	player: player(id)
})

const shown = (number: number, receivedAtMs = 100): PlayerAction => ({
	type: GAME_ACTION_TYPES.questionShown,
	question: question(number),
	receivedAtMs
})

const closed = (number: number): PlayerAction => ({
	type: GAME_ACTION_TYPES.questionClosed,
	number
})

const ended: PlayerAction = { type: GAME_ACTION_TYPES.gameEnded }

function snapshot(
	status: PlayerState['status'] & number,
	currentNumber: number | null,
	players: GamePlayerDto[] = [player(1)]
): PlayerAction {
	return {
		type: GAME_ACTION_TYPES.snapshot,
		status,
		players,
		currentQuestion: currentNumber === null ? null : question(currentNumber),
		receivedAtMs: 200
	}
}

function run(...actions: PlayerAction[]): PlayerState {
	return actions.reduce(gameReducer<PlayerQuestionDto>, initial)
}

describe('gameReducer', () => {
	describe('the connect response (snapshot)', () => {
		it('fills the empty state with the lobby', () => {
			const state = run(
				snapshot(GameStatus.Lobby, null, [player(1), player(2)])
			)

			expect(state.status).toBe(GameStatus.Lobby)
			expect(state.players.map(p => p.id)).toEqual([1, 2])
			expect(state.currentQuestion).toBeNull()
			expect(state.questionReceivedAtMs).toBeNull()
		})

		it('fills the state of a game that is already running', () => {
			const state = run(snapshot(GameStatus.Question, 2))

			expect(state.status).toBe(GameStatus.Question)
			expect(state.currentQuestion?.number).toBe(2)
			expect(state.questionReceivedAtMs).toBe(200)
			expect(state.closedQuestionNumber).toBeNull()
		})

		it('remembers which question was closed when it comes while the results are shown', () => {
			const state = run(snapshot(GameStatus.Results, 2))

			expect(state.status).toBe(GameStatus.Results)
			expect(state.closedQuestionNumber).toBe(2)
		})

		it('does not bring back a question that an event has already closed', () => {
			const state = run(shown(1), closed(1), snapshot(GameStatus.Question, 1))

			expect(state.status).toBe(GameStatus.Results)
			expect(state.closedQuestionNumber).toBe(1)
		})

		it('does not undo the end of the game', () => {
			const state = run(shown(1), ended, snapshot(GameStatus.Question, 1))

			expect(state.status).toBe(GameStatus.Finished)
		})

		it('still merges its players when it is stale', () => {
			const state = run(
				shown(2),
				snapshot(GameStatus.Question, 1, [player(1), player(2)])
			)

			expect(state.currentQuestion?.number).toBe(2)
			expect(state.players.map(p => p.id)).toEqual([1, 2])
		})
	})

	describe('PlayerJoined', () => {
		it('adds a player', () => {
			expect(run(joined(1), joined(2)).players.map(p => p.id)).toEqual([1, 2])
		})

		it('does not duplicate a player that is also in the snapshot', () => {
			const state = run(
				joined(2),
				snapshot(GameStatus.Lobby, null, [player(1), player(2)])
			)

			expect(state.players.map(p => p.id).sort()).toEqual([1, 2])
		})

		it('does not change the status', () => {
			expect(run(snapshot(GameStatus.Lobby, null), joined(2)).status).toBe(
				GameStatus.Lobby
			)
		})
	})

	describe('QuestionShown', () => {
		it('opens the question', () => {
			const state = run(snapshot(GameStatus.Lobby, null), shown(1, 500))

			expect(state.status).toBe(GameStatus.Question)
			expect(state.currentQuestion?.number).toBe(1)
			expect(state.questionReceivedAtMs).toBe(500)
		})

		it('replaces the closed question with the next one', () => {
			const state = run(shown(1), closed(1), shown(2))

			expect(state.status).toBe(GameStatus.Question)
			expect(state.currentQuestion?.number).toBe(2)
			expect(state.closedQuestionNumber).toBeNull()
		})

		it('ignores a repeat of a question that was already closed', () => {
			const state = run(shown(1), closed(1), shown(1))

			expect(state.status).toBe(GameStatus.Results)
		})

		it('ignores an earlier question', () => {
			expect(run(shown(2), shown(1)).currentQuestion?.number).toBe(2)
		})

		it('ignores a question after the game is over', () => {
			expect(run(shown(1), ended, shown(2)).status).toBe(GameStatus.Finished)
		})
	})

	describe('QuestionClosed', () => {
		it('moves to the results of that question', () => {
			const state = run(shown(1), closed(1))

			expect(state.status).toBe(GameStatus.Results)
			expect(state.closedQuestionNumber).toBe(1)
			expect(state.currentQuestion?.number).toBe(1)
		})

		it('ignores a late close of an earlier question', () => {
			const state = run(shown(1), closed(1), shown(2), closed(1))

			expect(state.status).toBe(GameStatus.Question)
			expect(state.currentQuestion?.number).toBe(2)
		})

		it('is kept when it arrives before the snapshot, and the snapshot then fills the question', () => {
			const state = run(closed(2), snapshot(GameStatus.Results, 2))

			expect(state.status).toBe(GameStatus.Results)
			expect(state.currentQuestion?.number).toBe(2)
			expect(state.closedQuestionNumber).toBe(2)
		})
	})

	describe('GameEnded', () => {
		it('finishes the game and keeps what was known', () => {
			const state = run(joined(1), shown(1), closed(1), ended)

			expect(state.status).toBe(GameStatus.Finished)
			expect(state.players).toHaveLength(1)
			expect(state.currentQuestion?.number).toBe(1)
		})

		it('works when it arrives before anything else', () => {
			expect(run(ended).status).toBe(GameStatus.Finished)
		})
	})

	it('does not change the state it was given', () => {
		const before = run(joined(1), shown(1))
		const copy = structuredClone(before)

		gameReducer(before, closed(1))
		gameReducer(before, joined(2))

		expect(before).toEqual(copy)
	})
})
