import { describe, expect, it, vi } from 'vitest'

import { addTime, submitAnswer } from '@modules/game/api/gameHubApi'
import { subscribeToGameEvents } from '@modules/game/api/subscribeToGameEvents'
import { GAME_HUB_EVENTS, GAME_HUB_METHODS } from '@modules/game/constants'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'

describe('live game contract', () => {
	it('submits the question identity and the answer, and extends the host deadline', async () => {
		const fake = new FakeHubConnection()
		const hub = fake.asHubConnection()
		await submitAnswer(hub, { questionNumber: 2, optionId: 7 })
		await submitAnswer(hub, { questionNumber: 3, text: 'Kyiv' })
		await addTime(hub, 10)
		expect(fake.invocations).toEqual([
			{
				method: GAME_HUB_METHODS.submitAnswer,
				args: [{ questionNumber: 2, optionId: 7 }]
			},
			{
				method: GAME_HUB_METHODS.submitAnswer,
				args: [{ questionNumber: 3, text: 'Kyiv' }]
			},
			{ method: GAME_HUB_METHODS.addTime, args: [10] }
		])
	})

	it('validates results, scores and presence, and unsubscribes every new event', () => {
		const fake = new FakeHubConnection()
		const onPlayerResults = vi.fn()
		const onLeaderboard = vi.fn()
		const onPlayerPresenceChanged = vi.fn()
		const stop = subscribeToGameEvents(fake.asHubConnection(), {
			onPlayerResults,
			onLeaderboard,
			onPlayerPresenceChanged
		})
		const result = {
			number: 1,
			answered: true,
			isCorrect: false,
			points: 0,
			total: 100,
			place: 2
		}
		fake.emit(GAME_HUB_EVENTS.playerResults, result)
		expect(onPlayerResults).toHaveBeenCalledWith(result)
		fake.emit(GAME_HUB_EVENTS.leaderboard, { entries: [], isFinal: true })
		expect(onLeaderboard).toHaveBeenCalledWith({ entries: [], isFinal: true })
		fake.emit(GAME_HUB_EVENTS.playerPresenceChanged, {
			playerId: 3,
			isOnline: false
		})
		expect(onPlayerPresenceChanged).toHaveBeenCalledWith({
			playerId: 3,
			isOnline: false
		})
		expect(() =>
			fake.emit(GAME_HUB_EVENTS.playerResults, { ...result, points: '100' })
		).toThrow()
		stop()
		fake.emit(GAME_HUB_EVENTS.playerResults, result)
		expect(onPlayerResults).toHaveBeenCalledTimes(1)
	})
})
