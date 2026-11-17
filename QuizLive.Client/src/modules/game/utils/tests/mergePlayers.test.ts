import { describe, expect, it } from 'vitest'

import type { GamePlayerDto } from '@modules/game/types'
import { mergePlayers } from '@modules/game/utils/mergePlayers'

function player(id: number, nickname = `Player ${id}`): GamePlayerDto {
	return { id, nickname, joinedAtUtc: '2026-11-17T10:00:00Z' }
}

describe('mergePlayers', () => {
	it('adds new players after the current ones', () => {
		const merged = mergePlayers([player(1)], [player(2), player(3)])

		expect(merged.map(p => p.id)).toEqual([1, 2, 3])
	})

	it('does not duplicate a player that arrives twice', () => {
		const merged = mergePlayers([player(1), player(2)], [player(2)])

		expect(merged.map(p => p.id)).toEqual([1, 2])
	})

	it('keeps the position of a player that is already in the list', () => {
		const merged = mergePlayers([player(1), player(2), player(3)], [player(2)])

		expect(merged.map(p => p.id)).toEqual([1, 2, 3])
	})

	it('takes the newer data of a player that is already there', () => {
		const merged = mergePlayers([player(1, 'Ann')], [player(1, 'Anna')])

		expect(merged).toEqual([player(1, 'Anna')])
	})

	it('merges a snapshot with the players that came as events earlier', () => {
		const fromEvents = [player(3), player(4)]
		const snapshot = [player(1), player(2), player(3)]

		const merged = mergePlayers(fromEvents, snapshot)

		expect(merged.map(p => p.id).sort()).toEqual([1, 2, 3, 4])
	})

	it('handles empty lists', () => {
		expect(mergePlayers([], [])).toEqual([])
		expect(mergePlayers([player(1)], [])).toEqual([player(1)])
		expect(mergePlayers([], [player(1)])).toEqual([player(1)])
	})

	it('does not change the lists it was given', () => {
		const current = [player(1)]
		const incoming = [player(2)]

		mergePlayers(current, incoming)

		expect(current).toEqual([player(1)])
		expect(incoming).toEqual([player(2)])
	})
})
