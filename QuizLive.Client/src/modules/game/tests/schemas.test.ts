import { describe, expect, it } from 'vitest'

import {
	gamePlayerDtoSchema,
	hostGameStateDtoSchema,
	hostQuestionDtoSchema,
	playerGameStateDtoSchema,
	playerQuestionDtoSchema
} from '@modules/game/schemas'

const timing = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: '2026-11-17T10:00:30Z',
	serverNowUtc: '2026-11-17T10:00:05Z'
}

const player = { id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T09:59:00Z' }

const game = {
	id: 7,
	code: '283646',
	quizId: 3,
	quizTitle: 'STEM basics',
	quizKind: 2,
	status: 0,
	createdAtUtc: '2026-11-17T09:58:00Z',
	endedAtUtc: null,
	players: [player]
}

const authorQuestion = {
	id: 11,
	order: 1,
	text: 'What is 2 + 2?',
	timeLimitSeconds: 30,
	basePoints: 100,
	imageUrl: null,
	options: [
		{ id: 21, order: 1, text: '4', isCorrect: true },
		{ id: 22, order: 2, text: '5', isCorrect: false }
	]
}

const hostQuestion = { number: 1, total: 3, question: authorQuestion, timing }

const playerQuestion = {
	number: 1,
	total: 3,
	text: 'What is 2 + 2?',
	imageUrl: null,
	timeLimitSeconds: 30,
	options: [
		{ id: 21, order: 1, text: '4' },
		{ id: 22, order: 2, text: '5' }
	],
	timing
}

describe('game hub schemas', () => {
	describe('hostGameStateDtoSchema', () => {
		it('parses the lobby: no current question', () => {
			const parsed = hostGameStateDtoSchema.parse({
				game,
				currentQuestion: null
			})

			expect(parsed.game.code).toBe('283646')
			expect(parsed.game.players).toHaveLength(1)
			expect(parsed.currentQuestion).toBeNull()
		})

		it('parses a game with a running question, with the correct option', () => {
			const parsed = hostGameStateDtoSchema.parse({
				game: { ...game, status: 1 },
				currentQuestion: hostQuestion
			})

			const options = parsed.currentQuestion?.question.options

			expect(options?.find(option => option.isCorrect)?.text).toBe('4')
		})

		it('rejects an unknown game status', () => {
			expect(() =>
				hostGameStateDtoSchema.parse({
					game: { ...game, status: 7 },
					currentQuestion: null
				})
			).toThrow()
		})

		it('rejects a status sent as text: the server sends numbers', () => {
			expect(() =>
				hostGameStateDtoSchema.parse({
					game: { ...game, status: 'Lobby' },
					currentQuestion: null
				})
			).toThrow()
		})

		it('rejects a response without currentQuestion', () => {
			expect(() => hostGameStateDtoSchema.parse({ game })).toThrow()
		})
	})

	describe('playerGameStateDtoSchema', () => {
		const lobbyState = {
			gameId: 7,
			code: '283646',
			quizTitle: 'STEM basics',
			status: 0,
			playerId: 1,
			nickname: 'Ann',
			players: [player],
			currentQuestion: null
		}

		it('parses the lobby', () => {
			const parsed = playerGameStateDtoSchema.parse(lobbyState)

			expect(parsed.nickname).toBe('Ann')
			expect(parsed.currentQuestion).toBeNull()
		})

		it('parses a connect in the middle of a question', () => {
			const parsed = playerGameStateDtoSchema.parse({
				...lobbyState,
				status: 1,
				currentQuestion: playerQuestion
			})

			expect(parsed.currentQuestion?.number).toBe(1)
			expect(parsed.currentQuestion?.options).toHaveLength(2)
		})
	})

	describe('playerQuestionDtoSchema', () => {
		it('parses an open text question: options are null', () => {
			const parsed = playerQuestionDtoSchema.parse({
				...playerQuestion,
				options: null,
				timeLimitSeconds: null,
				timing: { ...timing, endsAtUtc: null }
			})

			expect(parsed.options).toBeNull()
			expect(parsed.timing.endsAtUtc).toBeNull()
		})

		it('never keeps a correct option, even if one was sent by mistake', () => {
			const parsed = playerQuestionDtoSchema.parse({
				...playerQuestion,
				options: [
					{ id: 21, order: 1, text: '4', isCorrect: true },
					{ id: 22, order: 2, text: '5', isCorrect: false }
				]
			})

			expect(JSON.stringify(parsed)).not.toContain('isCorrect')
		})

		it('rejects a question without timing', () => {
			expect(() =>
				playerQuestionDtoSchema.parse({ ...playerQuestion, timing: undefined })
			).toThrow()
		})
	})

	describe('hostQuestionDtoSchema', () => {
		it('parses a poll question: no option is correct', () => {
			const parsed = hostQuestionDtoSchema.parse({
				...hostQuestion,
				question: {
					...authorQuestion,
					basePoints: null,
					options: [
						{ id: 21, order: 1, text: 'Tea', isCorrect: null },
						{ id: 22, order: 2, text: 'Coffee', isCorrect: null }
					]
				}
			})

			expect(parsed.question.options?.every(o => o.isCorrect === null)).toBe(
				true
			)
		})
	})

	describe('gamePlayerDtoSchema', () => {
		it('rejects a player without a nickname', () => {
			expect(() => gamePlayerDtoSchema.parse({ id: 1 })).toThrow()
		})
	})
})
