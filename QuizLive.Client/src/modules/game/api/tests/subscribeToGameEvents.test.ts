import { beforeEach, describe, expect, it, vi } from 'vitest'

import { subscribeToGameEvents } from '@modules/game/api/subscribeToGameEvents'
import { GAME_HUB_EVENTS } from '@modules/game/constants'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'

const timing = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: '2026-11-17T10:00:30Z',
	serverNowUtc: '2026-11-17T10:00:05Z'
}

const playerQuestion = {
	number: 1,
	total: 2,
	text: 'What is 2 + 2?',
	imageUrl: null,
	timeLimitSeconds: 30,
	options: [
		{ id: 21, order: 1, text: '4' },
		{ id: 22, order: 2, text: '5' }
	],
	timing
}

const hostQuestion = {
	number: 1,
	total: 2,
	question: {
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
	},
	timing
}

describe('subscribeToGameEvents', () => {
	let fake: FakeHubConnection

	beforeEach(() => {
		fake = new FakeHubConnection()
	})

	it('gives a joined player to onPlayerJoined', () => {
		const onPlayerJoined = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onPlayerJoined })

		fake.emit(GAME_HUB_EVENTS.playerJoined, {
			id: 2,
			nickname: 'Bob',
			joinedAtUtc: '2026-11-17T10:00:00Z'
		})

		expect(onPlayerJoined).toHaveBeenCalledWith({
			id: 2,
			nickname: 'Bob',
			joinedAtUtc: '2026-11-17T10:00:00Z'
		})
	})

	it('gives the player version of a question to onQuestionShown', () => {
		const onQuestionShown = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onQuestionShown })

		fake.emit(GAME_HUB_EVENTS.questionShown, playerQuestion)

		expect(onQuestionShown).toHaveBeenCalledWith(playerQuestion)
	})

	it('never passes a correct option to the player handler, even if one was sent', () => {
		const onQuestionShown = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onQuestionShown })

		fake.emit(GAME_HUB_EVENTS.questionShown, {
			...playerQuestion,
			options: [{ id: 21, order: 1, text: '4', isCorrect: true }]
		})

		expect(JSON.stringify(onQuestionShown.mock.calls)).not.toContain(
			'isCorrect'
		)
	})

	it('gives the host version of a question, with the correct option, to onHostQuestionShown', () => {
		const onHostQuestionShown = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onHostQuestionShown })

		fake.emit(GAME_HUB_EVENTS.hostQuestionShown, hostQuestion)

		expect(onHostQuestionShown).toHaveBeenCalledWith(hostQuestion)
	})

	it('gives the number of the closed question to onQuestionClosed', () => {
		const onQuestionClosed = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onQuestionClosed })

		fake.emit(GAME_HUB_EVENTS.questionClosed, 2)

		expect(onQuestionClosed).toHaveBeenCalledWith(2)
	})

	it('tells onGameEnded that the game is over', () => {
		const onGameEnded = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onGameEnded })

		fake.emit(GAME_HUB_EVENTS.gameEnded)

		expect(onGameEnded).toHaveBeenCalledOnce()
	})

	it('ignores an event nobody asked for', () => {
		subscribeToGameEvents(fake.asHubConnection(), {})

		expect(() => fake.emit(GAME_HUB_EVENTS.gameEnded)).not.toThrow()
		expect(() => fake.emit(GAME_HUB_EVENTS.questionClosed, 1)).not.toThrow()
	})

	it('throws on a payload that does not match the contract', () => {
		const onQuestionShown = vi.fn()
		subscribeToGameEvents(fake.asHubConnection(), { onQuestionShown })

		expect(() =>
			fake.emit(GAME_HUB_EVENTS.questionShown, { number: 'one' })
		).toThrow()
		expect(onQuestionShown).not.toHaveBeenCalled()
	})

	it('stops listening when the returned function is called', () => {
		const onGameEnded = vi.fn()
		const unsubscribe = subscribeToGameEvents(fake.asHubConnection(), {
			onGameEnded
		})

		unsubscribe()
		fake.emit(GAME_HUB_EVENTS.gameEnded)

		expect(onGameEnded).not.toHaveBeenCalled()
		expect(fake.handlerCount(GAME_HUB_EVENTS.gameEnded)).toBe(0)
	})

	it('does not touch the handlers of another subscription', () => {
		const first = vi.fn()
		const second = vi.fn()
		const stopFirst = subscribeToGameEvents(fake.asHubConnection(), {
			onGameEnded: first
		})
		subscribeToGameEvents(fake.asHubConnection(), { onGameEnded: second })

		stopFirst()
		fake.emit(GAME_HUB_EVENTS.gameEnded)

		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledOnce()
	})
})
