import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameHubConnection } from '@modules/game/api/createGameHubConnection'
import {
	GAME_CONNECTION_STATE,
	GAME_ERROR_COPY,
	GAME_HUB_EVENTS,
	GAME_HUB_METHODS,
	GameStatus
} from '@modules/game/constants'
import { useHostGame } from '@modules/game/hooks/useHostGame'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'

vi.mock('@modules/game/api/createGameHubConnection', () => ({
	createGameHubConnection: vi.fn()
}))

vi.mock('@modules/auth/store/sessionStore', () => ({
	readSession: () => ({
		token: 'jwt-1',
		expiresAtUtc: '2099-01-01T00:00:00Z',
		user: { id: 'u1', userName: 'quizzer' }
	})
}))

const GAME_ID = 7

let fake: FakeHubConnection

const ann = { id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T10:00:00Z' }
const bob = { id: 2, nickname: 'Bob', joinedAtUtc: '2026-11-17T10:00:10Z' }

function hostQuestion(number: number) {
	return {
		number,
		total: 3,
		question: {
			id: 10 + number,
			order: number,
			text: `Question ${number}`,
			timeLimitSeconds: 30,
			basePoints: 100,
			imageUrl: null,
			options: [
				{ id: 21, order: 1, text: '4', isCorrect: true },
				{ id: 22, order: 2, text: '5', isCorrect: false }
			]
		},
		timing: {
			startedAtUtc: '2026-11-17T10:00:00Z',
			endsAtUtc: '2026-11-17T10:00:30Z',
			serverNowUtc: '2026-11-17T10:00:05Z'
		}
	}
}

function hostState(
	status: number,
	players = [ann],
	currentQuestion: ReturnType<typeof hostQuestion> | null = null
) {
	return {
		game: {
			id: GAME_ID,
			code: '283646',
			quizId: 3,
			quizTitle: 'STEM basics',
			quizKind: 2,
			status,
			createdAtUtc: '2026-11-17T09:58:00Z',
			endedAtUtc: null,
			players
		},
		currentQuestion
	}
}

async function renderConnected(gameId = GAME_ID) {
	const rendered = renderHook(() => useHostGame(gameId))

	await waitFor(() =>
		expect(rendered.result.current.connectionState).toBe(
			GAME_CONNECTION_STATE.connected
		)
	)

	return rendered
}

describe('useHostGame', () => {
	it('extends the question and applies the broadcast timing on the host connection', async () => {
		const { result } = await renderConnected()
		act(() => {
			fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion(1))
		})
		await act(async () => {
			await result.current.commands.addTime(10)
		})
		expect(fake.invocations).toContainEqual({
			method: GAME_HUB_METHODS.addTime,
			args: [10]
		})
		const extended = {
			...hostQuestion(1).timing,
			endsAtUtc: '2026-11-17T10:01:00Z'
		}
		act(() => {
			fake.emit(GAME_HUB_EVENTS.timeAdded, { number: 1, timing: extended })
		})
		expect(result.current.currentQuestion?.timing).toEqual(extended)
	})
	beforeEach(() => {
		fake = new FakeHubConnection()
		fake.respondWith(
			GAME_HUB_METHODS.connectAsHost,
			hostState(GameStatus.Lobby)
		)
		vi.mocked(createGameHubConnection).mockReset()
		vi.mocked(createGameHubConnection).mockImplementation(() =>
			fake.asHubConnection()
		)
	})

	describe('joining the game', () => {
		it('joins the game with the JWT of the host', async () => {
			await renderConnected()

			const accessTokenFactory = vi.mocked(createGameHubConnection).mock
				.calls[0]?.[0]

			expect(accessTokenFactory?.()).toBe('jwt-1')
			expect(fake.invocations).toEqual([
				{ method: GAME_HUB_METHODS.connectAsHost, args: [GAME_ID] }
			])
		})

		it('gives the game and the players from the answer', async () => {
			fake.respondWith(
				GAME_HUB_METHODS.connectAsHost,
				hostState(GameStatus.Lobby, [ann, bob])
			)

			const { result } = await renderConnected()

			expect(result.current.game).toEqual({
				id: GAME_ID,
				code: '283646',
				quizId: 3,
				quizTitle: 'STEM basics',
				quizKind: 2
			})
			expect(result.current.status).toBe(GameStatus.Lobby)
			expect(result.current.players.map(p => p.nickname)).toEqual([
				'Ann',
				'Bob'
			])
			expect(result.current.currentQuestion).toBeNull()
		})

		it('gets the running question when the host opens the game in the middle of it', async () => {
			fake.respondWith(
				GAME_HUB_METHODS.connectAsHost,
				hostState(GameStatus.Question, [ann], hostQuestion(2))
			)

			const { result } = await renderConnected()

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(2)
			expect(
				result.current.currentQuestion?.question.options?.find(o => o.isCorrect)
					?.text
			).toBe('4')
			expect(result.current.questionReceivedAtMs).not.toBeNull()
		})

		it('shows the text of the server when the game cannot be joined', async () => {
			fake.failWith(
				GAME_HUB_METHODS.connectAsHost,
				new Error(
					"An unexpected error occurred invoking 'ConnectAsHost' on the server. HubException: Game 7 was not found."
				)
			)

			const { result } = renderHook(() => useHostGame(GAME_ID))

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.failed
				)
			)
			expect(result.current.error).toBe('Game 7 was not found.')
			expect(result.current.game).toBeNull()
		})

		it.each([0, -1, 1.5, Number.NaN])(
			'does not connect for the game id %s',
			gameId => {
				const { result } = renderHook(() => useHostGame(gameId))

				expect(createGameHubConnection).not.toHaveBeenCalled()
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.disconnected
				)
			}
		)
	})

	describe('events', () => {
		it('adds a player who joins the lobby', async () => {
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.playerJoined, bob))

			expect(result.current.players.map(p => p.nickname)).toEqual([
				'Ann',
				'Bob'
			])
		})

		it('does not list a player twice when the event repeats the answer', async () => {
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.playerJoined, ann))

			expect(result.current.players).toHaveLength(1)
		})

		it('shows the question the host gets, with the correct option', async () => {
			const now = vi.spyOn(Date, 'now').mockReturnValue(5_000)
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion(1)))

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(1)
			expect(result.current.questionReceivedAtMs).toBe(5_000)
			expect(result.current.closedQuestionNumber).toBeNull()

			now.mockRestore()
		})

		it('ignores the question meant for players', async () => {
			const { result } = await renderConnected()

			act(() =>
				fake.emit(GAME_HUB_EVENTS.questionShown, {
					number: 1,
					total: 3,
					text: 'Question 1',
					imageUrl: null,
					timeLimitSeconds: 30,
					options: null,
					timing: hostQuestion(1).timing
				})
			)

			expect(result.current.status).toBe(GameStatus.Lobby)
			expect(result.current.currentQuestion).toBeNull()
		})

		it('follows the whole game: question, results, next question, end', async () => {
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion(1)))
			act(() => fake.emit(GAME_HUB_EVENTS.questionClosed, 1))

			expect(result.current.status).toBe(GameStatus.Results)
			expect(result.current.closedQuestionNumber).toBe(1)

			act(() => fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion(2)))

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(2)

			act(() => fake.emit(GAME_HUB_EVENTS.gameEnded))

			expect(result.current.status).toBe(GameStatus.Finished)
		})
	})

	describe('after a reconnect', () => {
		it('joins again and takes the state the server has now', async () => {
			const { result } = await renderConnected()

			fake.respondWith(
				GAME_HUB_METHODS.connectAsHost,
				hostState(GameStatus.Question, [ann, bob], hostQuestion(1))
			)
			act(() => fake.simulateReconnecting())
			act(() => fake.simulateReconnected())

			await waitFor(() =>
				expect(result.current.status).toBe(GameStatus.Question)
			)
			expect(result.current.players).toHaveLength(2)
			expect(fake.invocations).toHaveLength(2)
		})

		it('does not let an old answer bring back a question that was closed', async () => {
			const { result } = await renderConnected()
			act(() => fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion(1)))
			act(() => fake.emit(GAME_HUB_EVENTS.questionClosed, 1))

			fake.respondWith(
				GAME_HUB_METHODS.connectAsHost,
				hostState(GameStatus.Question, [ann], hostQuestion(1))
			)
			act(() => fake.simulateReconnected())

			await waitFor(() => expect(fake.invocations).toHaveLength(2))
			expect(result.current.status).toBe(GameStatus.Results)
		})
	})

	describe('commands', () => {
		it.each([
			['startGame', GAME_HUB_METHODS.startGame],
			['showResults', GAME_HUB_METHODS.showResults],
			['nextQuestion', GAME_HUB_METHODS.nextQuestion],
			['endGame', GAME_HUB_METHODS.endGame]
		] as const)(
			'%s calls its hub method and gives back no error',
			async (name, method) => {
				const { result } = await renderConnected()

				let error: string | null = 'not run'
				await act(async () => {
					error = await result.current.commands[name]()
				})

				expect(error).toBeNull()
				expect(fake.invocations.at(-1)).toEqual({ method, args: [] })
			}
		)

		it('gives back the readable text when the server rejects a command', async () => {
			fake.failWith(
				GAME_HUB_METHODS.nextQuestion,
				new Error(
					"An unexpected error occurred invoking 'NextQuestion' on the server. HubException: The next question can be shown only after the results of the current one."
				)
			)
			const { result } = await renderConnected()

			let error: string | null = null
			await act(async () => {
				error = await result.current.commands.nextQuestion()
			})

			expect(error).toBe(
				'The next question can be shown only after the results of the current one.'
			)
		})

		it('says it is not connected when a command comes before the connection has started', async () => {
			fake.holdStart()
			const { result } = renderHook(() => useHostGame(GAME_ID))

			let error: string | null = null
			await act(async () => {
				error = await result.current.commands.startGame()
			})

			expect(error).toBe(GAME_ERROR_COPY.notConnected)
			expect(fake.invocations).toHaveLength(0)
		})
	})

	it('stops the connection when the host leaves the page', async () => {
		const { unmount } = await renderConnected()

		unmount()

		expect(fake.stopCalls).toBe(1)
	})
})
