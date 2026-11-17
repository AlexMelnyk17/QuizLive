import { beforeEach, describe, expect, it } from 'vitest'

import {
	connectAsHost,
	connectAsPlayer,
	endGame,
	nextQuestion,
	showResults,
	startGame
} from '@modules/game/api/gameHubApi'
import { GAME_HUB_METHODS } from '@modules/game/constants'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'

const timing = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: null,
	serverNowUtc: '2026-11-17T10:00:05Z'
}

const hostGame = {
	id: 7,
	code: '283646',
	quizId: 3,
	quizTitle: 'STEM basics',
	quizKind: 0,
	status: 0,
	createdAtUtc: '2026-11-17T09:58:00Z',
	endedAtUtc: null,
	players: []
}

const playerState = {
	gameId: 7,
	code: '283646',
	quizTitle: 'STEM basics',
	status: 1,
	playerId: 1,
	nickname: 'Ann',
	players: [{ id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T09:59:00Z' }],
	currentQuestion: {
		number: 1,
		total: 2,
		text: 'What did you like?',
		imageUrl: null,
		timeLimitSeconds: null,
		options: null,
		timing
	}
}

describe('gameHubApi', () => {
	let fake: FakeHubConnection

	beforeEach(() => {
		fake = new FakeHubConnection()
	})

	describe('connectAsHost', () => {
		it('asks the hub for the game and parses the answer', async () => {
			fake.respondWith(GAME_HUB_METHODS.connectAsHost, {
				game: hostGame,
				currentQuestion: null
			})

			const state = await connectAsHost(fake.asHubConnection(), 7)

			expect(fake.invocations).toEqual([
				{ method: GAME_HUB_METHODS.connectAsHost, args: [7] }
			])
			expect(state.game.code).toBe('283646')
			expect(state.currentQuestion).toBeNull()
		})

		it('rejects an answer that does not match the contract', async () => {
			fake.respondWith(GAME_HUB_METHODS.connectAsHost, hostGame)

			await expect(connectAsHost(fake.asHubConnection(), 7)).rejects.toThrow()
		})

		it('passes a hub error on with its readable message', async () => {
			fake.failWith(
				GAME_HUB_METHODS.connectAsHost,
				new Error('Game 7 was not found.')
			)

			await expect(connectAsHost(fake.asHubConnection(), 7)).rejects.toThrow(
				'Game 7 was not found.'
			)
		})
	})

	describe('connectAsPlayer', () => {
		it('sends the player token and parses the state with the running question', async () => {
			fake.respondWith(GAME_HUB_METHODS.connectAsPlayer, playerState)

			const state = await connectAsPlayer(fake.asHubConnection(), 'token-1')

			expect(fake.invocations).toEqual([
				{ method: GAME_HUB_METHODS.connectAsPlayer, args: ['token-1'] }
			])
			expect(state.currentQuestion?.number).toBe(1)
		})

		it('rejects an answer that does not match the contract', async () => {
			fake.respondWith(GAME_HUB_METHODS.connectAsPlayer, {
				...playerState,
				status: 9
			})

			await expect(
				connectAsPlayer(fake.asHubConnection(), 'token-1')
			).rejects.toThrow()
		})

		it('passes a hub error on with its readable message', async () => {
			fake.failWith(
				GAME_HUB_METHODS.connectAsPlayer,
				new Error('Player was not found.')
			)

			await expect(
				connectAsPlayer(fake.asHubConnection(), 'nope')
			).rejects.toThrow('Player was not found.')
		})
	})

	describe('the host commands', () => {
		it.each([
			['startGame', startGame, GAME_HUB_METHODS.startGame],
			['showResults', showResults, GAME_HUB_METHODS.showResults],
			['nextQuestion', nextQuestion, GAME_HUB_METHODS.nextQuestion],
			['endGame', endGame, GAME_HUB_METHODS.endGame]
		])(
			'%s calls its hub method without arguments',
			async (_name, command, method) => {
				await command(fake.asHubConnection())

				expect(fake.invocations).toEqual([{ method, args: [] }])
			}
		)

		it('passes a rejected command on with its readable message', async () => {
			fake.failWith(
				GAME_HUB_METHODS.nextQuestion,
				new Error('The next question can be shown only after the results.')
			)

			await expect(nextQuestion(fake.asHubConnection())).rejects.toThrow(
				'only after the results'
			)
		})
	})
})
