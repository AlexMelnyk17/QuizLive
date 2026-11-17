import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameHubConnection } from '@modules/game/api/createGameHubConnection'
import {
	GAME_CONNECTION_STATE,
	GAME_HUB_EVENTS,
	GAME_HUB_METHODS,
	GameStatus
} from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'
import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'
import type { PlayerQuestionDto } from '@modules/game/types'

vi.mock('@modules/game/api/createGameHubConnection', () => ({
	createGameHubConnection: vi.fn()
}))

const TOKEN = 'token-1'

let fake: FakeHubConnection

const ann = { id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T10:00:00Z' }
const bob = { id: 2, nickname: 'Bob', joinedAtUtc: '2026-11-17T10:00:10Z' }

const timing = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: '2026-11-17T10:00:30Z',
	serverNowUtc: '2026-11-17T10:00:05Z'
}

function playerQuestion(number: number): PlayerQuestionDto {
	return {
		number,
		total: 3,
		text: `Question ${number}`,
		imageUrl: null,
		timeLimitSeconds: 30,
		options: [
			{ id: 21, order: 1, text: '4' },
			{ id: 22, order: 2, text: '5' }
		],
		timing
	}
}

function playerState(
	status: number,
	players = [ann],
	currentQuestion: ReturnType<typeof playerQuestion> | null = null
) {
	return {
		gameId: 7,
		code: '283646',
		quizTitle: 'STEM basics',
		status,
		playerId: 1,
		nickname: 'Ann',
		players,
		currentQuestion
	}
}

async function renderConnected() {
	const rendered = renderHook(() => usePlayerGame())

	await waitFor(() =>
		expect(rendered.result.current.connectionState).toBe(
			GAME_CONNECTION_STATE.connected
		)
	)

	return rendered
}

describe('usePlayerGame', () => {
	it('replaces the selected answer while open and clears selection for the next question', async () => {
		fake.respondWith(
			GAME_HUB_METHODS.connectAsPlayer,
			playerState(GameStatus.Question, [ann], {
				...playerQuestion(1),
				timing: { ...timing, endsAtUtc: null }
			})
		)
		const { result } = await renderConnected()
		await act(async () => {
			await result.current.submitAnswer({ questionNumber: 1, optionId: 21 })
		})
		expect(result.current.hasAnswered).toBe(true)
		await act(async () => {
			await result.current.submitAnswer({ questionNumber: 1, optionId: 22 })
		})
		expect(result.current.selectedAnswer).toEqual({
			questionNumber: 1,
			optionId: 22
		})
		expect(
			fake.invocations.filter(
				call => call.method === GAME_HUB_METHODS.submitAnswer
			)
		).toEqual([
			{
				method: GAME_HUB_METHODS.submitAnswer,
				args: [{ questionNumber: 1, optionId: 21 }]
			},
			{
				method: GAME_HUB_METHODS.submitAnswer,
				args: [{ questionNumber: 1, optionId: 22 }]
			}
		])
		act(() => {
			fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(2))
		})
		expect(result.current.hasAnswered).toBe(false)
		expect(result.current.selectedAnswer).toBeNull()
	})

	it('restores an accepted answer from a reconnect snapshot', async () => {
		const { result } = await renderConnected()
		fake.respondWith(GAME_HUB_METHODS.connectAsPlayer, {
			...playerState(GameStatus.Question, [ann], playerQuestion(1)),
			hasAnswered: true,
			currentAnswer: { questionNumber: 1, optionId: 21, text: null }
		})
		act(() => {
			fake.simulateReconnecting()
			fake.simulateReconnected()
		})
		await waitFor(() => expect(result.current.hasAnswered).toBe(true))
		expect(result.current.selectedAnswer).toEqual({
			questionNumber: 1,
			optionId: 21
		})
	})

	it('blocks a double click and does not mark the next question answered when an old request finishes', async () => {
		fake.respondWith(
			GAME_HUB_METHODS.connectAsPlayer,
			playerState(GameStatus.Question, [ann], {
				...playerQuestion(1),
				timing: { ...timing, endsAtUtc: null }
			})
		)
		const { result } = await renderConnected()
		let complete: () => void = () => {}
		const response = new Promise<void>(resolve => {
			complete = resolve
		})
		const invoke = vi.spyOn(fake, 'invoke').mockImplementation(() => response)
		let first: Promise<string | null> = Promise.resolve(null)
		act(() => {
			first = result.current.submitAnswer({ questionNumber: 1, optionId: 21 })
		})
		expect(result.current.isSubmitting).toBe(true)
		await act(async () => {
			await result.current.submitAnswer({ questionNumber: 1, optionId: 22 })
		})
		expect(invoke).toHaveBeenCalledTimes(1)
		act(() => {
			fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(2))
		})
		await act(async () => {
			complete()
			await first
		})
		expect(result.current.currentQuestion?.number).toBe(2)
		expect(result.current.hasAnswered).toBe(false)
		expect(result.current.isSubmitting).toBe(false)
	})

	it('returns the server rejection without locking the answer', async () => {
		fake.respondWith(
			GAME_HUB_METHODS.connectAsPlayer,
			playerState(GameStatus.Question, [ann], {
				...playerQuestion(1),
				timing: { ...timing, endsAtUtc: null }
			})
		)
		fake.failWith(
			GAME_HUB_METHODS.submitAnswer,
			new Error('HubException: The question is closed.')
		)
		const { result } = await renderConnected()
		let message: string | null = null
		await act(async () => {
			message = await result.current.submitAnswer({
				questionNumber: 1,
				text: 'Hello'
			})
		})
		expect(message).toBe('The question is closed.')
		expect(result.current.hasAnswered).toBe(false)
		expect(result.current.isSubmitting).toBe(false)
	})

	it('applies an extension only to the open current question', async () => {
		fake.respondWith(
			GAME_HUB_METHODS.connectAsPlayer,
			playerState(GameStatus.Question, [ann], playerQuestion(1))
		)
		const { result } = await renderConnected()
		const extended = { ...timing, endsAtUtc: '2026-11-17T10:01:00Z' }
		act(() => {
			fake.emit(GAME_HUB_EVENTS.timeAdded, { number: 1, timing: extended })
		})
		expect(result.current.currentQuestion?.timing).toEqual(extended)
		act(() => {
			fake.emit(GAME_HUB_EVENTS.timeAdded, { number: 2, timing })
		})
		expect(result.current.currentQuestion?.timing).toEqual(extended)
	})
	beforeEach(() => {
		sessionStorage.clear()
		usePlayerTokenStore.setState({ playerToken: TOKEN })

		fake = new FakeHubConnection()
		fake.respondWith(
			GAME_HUB_METHODS.connectAsPlayer,
			playerState(GameStatus.Lobby)
		)
		vi.mocked(createGameHubConnection).mockReset()
		vi.mocked(createGameHubConnection).mockImplementation(() =>
			fake.asHubConnection()
		)
	})

	describe('without a player token', () => {
		it('connects nothing', () => {
			usePlayerTokenStore.setState({ playerToken: null })

			const { result } = renderHook(() => usePlayerGame())

			expect(createGameHubConnection).not.toHaveBeenCalled()
			expect(result.current.hasToken).toBe(false)
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.disconnected
			)
		})

		it('connects when the token appears, e.g. after the player joined a game', async () => {
			usePlayerTokenStore.setState({ playerToken: null })
			const { result } = renderHook(() => usePlayerGame())

			act(() => usePlayerTokenStore.getState().setPlayerToken(TOKEN))

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)
			expect(result.current.hasToken).toBe(true)
		})
	})

	describe('joining the game', () => {
		it('joins with the player token and without a JWT', async () => {
			await renderConnected()

			expect(
				vi.mocked(createGameHubConnection).mock.calls[0]?.[0]
			).toBeUndefined()
			expect(fake.invocations).toEqual([
				{ method: GAME_HUB_METHODS.connectAsPlayer, args: [TOKEN] }
			])
		})

		it('gives the player, the lobby and the players from the answer', async () => {
			fake.respondWith(
				GAME_HUB_METHODS.connectAsPlayer,
				playerState(GameStatus.Lobby, [ann, bob])
			)

			const { result } = await renderConnected()

			expect(result.current.player).toEqual({
				gameId: 7,
				code: '283646',
				quizTitle: 'STEM basics',
				playerId: 1,
				nickname: 'Ann'
			})
			expect(result.current.status).toBe(GameStatus.Lobby)
			expect(result.current.players.map(p => p.nickname)).toEqual([
				'Ann',
				'Bob'
			])
			expect(result.current.currentQuestion).toBeNull()
		})

		it('gets the running question when the player joins in the middle of it', async () => {
			fake.respondWith(
				GAME_HUB_METHODS.connectAsPlayer,
				playerState(GameStatus.Question, [ann], playerQuestion(2))
			)

			const { result } = await renderConnected()

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(2)
			expect(result.current.currentQuestion?.options).toHaveLength(2)
			expect(result.current.questionReceivedAtMs).not.toBeNull()
		})

		it('shows the text of the server when the token is not accepted, and keeps the token', async () => {
			fake.failWith(
				GAME_HUB_METHODS.connectAsPlayer,
				new Error(
					"An unexpected error occurred invoking 'ConnectAsPlayer' on the server. HubException: Player was not found."
				)
			)

			const { result } = renderHook(() => usePlayerGame())

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.failed
				)
			)
			expect(result.current.error).toBe('Player was not found.')
			expect(result.current.player).toBeNull()
			expect(result.current.hasToken).toBe(true)
		})
	})

	describe('events', () => {
		it('adds a player who joins the lobby, once', async () => {
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.playerJoined, bob))
			act(() => fake.emit(GAME_HUB_EVENTS.playerJoined, bob))
			act(() => fake.emit(GAME_HUB_EVENTS.playerJoined, ann))

			expect(result.current.players.map(p => p.nickname)).toEqual([
				'Ann',
				'Bob'
			])
		})

		it('shows a question when it is shown, and remembers when it arrived', async () => {
			const now = vi.spyOn(Date, 'now').mockReturnValue(9_000)
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(1)))

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(1)
			expect(result.current.questionReceivedAtMs).toBe(9_000)

			now.mockRestore()
		})

		it('never keeps a correct option, even if the server sent one by mistake', async () => {
			const { result } = await renderConnected()

			act(() =>
				fake.emit(GAME_HUB_EVENTS.questionShown, {
					...playerQuestion(1),
					options: [{ id: 21, order: 1, text: '4', isCorrect: true }]
				})
			)

			expect(JSON.stringify(result.current.currentQuestion)).not.toContain(
				'isCorrect'
			)
		})

		it('ignores the question meant for the host', async () => {
			const { result } = await renderConnected()

			act(() =>
				fake.emit(GAME_HUB_EVENTS.hostQuestionShown, {
					number: 1,
					total: 3,
					question: {
						id: 11,
						order: 1,
						text: 'Question 1',
						timeLimitSeconds: 30,
						basePoints: 100,
						imageUrl: null,
						options: [{ id: 21, order: 1, text: '4', isCorrect: true }]
					},
					timing
				})
			)

			expect(result.current.status).toBe(GameStatus.Lobby)
			expect(result.current.currentQuestion).toBeNull()
		})

		it('follows the whole game: question, results, next question, end', async () => {
			const { result } = await renderConnected()

			act(() => fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(1)))
			act(() => fake.emit(GAME_HUB_EVENTS.questionClosed, 1))

			expect(result.current.status).toBe(GameStatus.Results)
			expect(result.current.closedQuestionNumber).toBe(1)

			act(() => fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(2)))

			expect(result.current.status).toBe(GameStatus.Question)
			expect(result.current.currentQuestion?.number).toBe(2)
			expect(result.current.closedQuestionNumber).toBeNull()

			act(() => fake.emit(GAME_HUB_EVENTS.gameEnded))

			expect(result.current.status).toBe(GameStatus.Finished)
		})
	})

	describe('after a reconnect', () => {
		it('joins again and takes the state the server has now', async () => {
			const { result } = await renderConnected()

			fake.respondWith(
				GAME_HUB_METHODS.connectAsPlayer,
				playerState(GameStatus.Question, [ann, bob], playerQuestion(1))
			)
			act(() => fake.simulateReconnecting())
			act(() => fake.simulateReconnected())

			await waitFor(() =>
				expect(result.current.status).toBe(GameStatus.Question)
			)
			expect(result.current.players).toHaveLength(2)
			expect(fake.invocations).toHaveLength(2)
		})

		it('does not let an old answer undo the end of the game', async () => {
			const { result } = await renderConnected()
			act(() => fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion(1)))
			act(() => fake.emit(GAME_HUB_EVENTS.gameEnded))

			fake.respondWith(
				GAME_HUB_METHODS.connectAsPlayer,
				playerState(GameStatus.Question, [ann], playerQuestion(1))
			)
			act(() => fake.simulateReconnected())

			await waitFor(() => expect(fake.invocations).toHaveLength(2))
			expect(result.current.status).toBe(GameStatus.Finished)
		})
	})

	describe('leaving', () => {
		it('forgets the token and disconnects', async () => {
			const { result } = await renderConnected()

			act(() => result.current.leave())

			expect(usePlayerTokenStore.getState().playerToken).toBeNull()
			expect(result.current.hasToken).toBe(false)
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.disconnected
			)
			expect(fake.stopCalls).toBe(1)
		})
	})

	it('stops the connection when the player leaves the page', async () => {
		const { unmount } = await renderConnected()

		unmount()

		expect(fake.stopCalls).toBe(1)
		expect(usePlayerTokenStore.getState().playerToken).toBe(TOKEN)
	})
})
