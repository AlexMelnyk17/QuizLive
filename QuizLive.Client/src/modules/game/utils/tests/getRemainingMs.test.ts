import { describe, expect, it } from 'vitest'

import type { QuestionTimingDto } from '@modules/game/types'
import { getRemainingMs } from '@modules/game/utils/getRemainingMs'

// The server built the message at 10:00:05 and the question ends at 10:00:30: 25 seconds were left.
const timing: QuestionTimingDto = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: '2026-11-17T10:00:30Z',
	serverNowUtc: '2026-11-17T10:00:05Z'
}

describe('getRemainingMs', () => {
	it('gives the time left when the message has just arrived', () => {
		expect(getRemainingMs(timing, 1_000, 1_000)).toBe(25_000)
	})

	it('takes off the time that passed since the message arrived', () => {
		expect(getRemainingMs(timing, 1_000, 4_000)).toBe(22_000)
	})

	it('does not depend on the clock of the device', () => {
		// The device thinks it is 1970 or 2100: only the difference between "now" and "arrived" counts.
		const wrongClockInThePast = getRemainingMs(timing, 5_000, 8_000)
		const wrongClockInTheFuture = getRemainingMs(
			timing,
			4_102_444_800_000,
			4_102_444_803_000
		)

		expect(wrongClockInThePast).toBe(22_000)
		expect(wrongClockInTheFuture).toBe(22_000)
	})

	it('never goes below zero', () => {
		expect(getRemainingMs(timing, 0, 60_000)).toBe(0)
	})

	it('gives null for a question without a time limit', () => {
		expect(getRemainingMs({ ...timing, endsAtUtc: null }, 0, 10_000)).toBeNull()
	})

	it('reads dates without "Z" as UTC, like the ones the server takes from the database', () => {
		const withoutZ: QuestionTimingDto = {
			startedAtUtc: '2026-11-17T10:00:00',
			endsAtUtc: '2026-11-17T10:00:30',
			serverNowUtc: '2026-11-17T10:00:05Z'
		}

		expect(getRemainingMs(withoutZ, 0, 0)).toBe(25_000)
	})
})
