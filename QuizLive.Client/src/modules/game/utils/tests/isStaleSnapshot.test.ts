import { describe, expect, it } from 'vitest'

import { GameStatus } from '@modules/game/constants'
import type { GameProgress } from '@modules/game/types'
import { isStaleSnapshot } from '@modules/game/utils/isStaleSnapshot'

const unknown: GameProgress = { status: null, questionNumber: null }
const lobby: GameProgress = { status: GameStatus.Lobby, questionNumber: null }
const asking = (questionNumber: number): GameProgress => ({
	status: GameStatus.Question,
	questionNumber
})
const showingResults = (questionNumber: number): GameProgress => ({
	status: GameStatus.Results,
	questionNumber
})
const finished: GameProgress = {
	status: GameStatus.Finished,
	questionNumber: 2
}

describe('isStaleSnapshot', () => {
	it('is never stale while nothing is known yet', () => {
		expect(isStaleSnapshot(unknown, lobby)).toBe(false)
		expect(isStaleSnapshot(unknown, finished)).toBe(false)
	})

	it('is not stale when it describes the same moment', () => {
		expect(isStaleSnapshot(asking(1), asking(1))).toBe(false)
		expect(isStaleSnapshot(lobby, lobby)).toBe(false)
	})

	it.each([
		['the next status of the same question', asking(1), showingResults(1)],
		['a later question', showingResults(1), asking(2)],
		['the start of the game', lobby, asking(1)],
		['the end of the game', showingResults(2), finished]
	])('is not stale when it is ahead: %s', (_name, current, incoming) => {
		expect(isStaleSnapshot(current, incoming)).toBe(false)
	})

	it.each([
		[
			'the results of the same question after it was asked',
			showingResults(1),
			asking(1)
		],
		['an earlier question', asking(2), asking(1)],
		[
			'an earlier question after its results',
			showingResults(2),
			showingResults(1)
		],
		['the lobby after the game started', asking(1), lobby],
		['a question after the game finished', finished, asking(2)],
		['the lobby after the game finished', finished, lobby]
	])('is stale when it is behind: %s', (_name, current, incoming) => {
		expect(isStaleSnapshot(current, incoming)).toBe(true)
	})

	it('is not stale when a game that has just been joined is already running', () => {
		expect(isStaleSnapshot(lobby, showingResults(3))).toBe(false)
	})
})
