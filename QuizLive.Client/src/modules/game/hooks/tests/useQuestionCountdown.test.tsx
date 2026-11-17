import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type { QuestionTimingDto } from '@modules/game/types'

const START = new Date('2026-11-17T10:00:00Z')

// The server built the message at 10:00:05 and the question ends at 10:00:30: 25 seconds are left.
const timing: QuestionTimingDto = {
	startedAtUtc: '2026-11-17T10:00:00Z',
	endsAtUtc: '2026-11-17T10:00:30Z',
	serverNowUtc: '2026-11-17T10:00:05Z'
}

// Lets the time pass, and lets React show what the timers did.
function advance(ms: number) {
	act(() => {
		vi.advanceTimersByTime(ms)
	})
}

describe('useQuestionCountdown', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(START)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('gives the seconds left when the question has just arrived', () => {
		const { result } = renderHook(() =>
			useQuestionCountdown(timing, Date.now())
		)

		expect(result.current).toBe(25)
	})

	it('counts down once a second', () => {
		const receivedAt = Date.now()
		const { result } = renderHook(() =>
			useQuestionCountdown(timing, receivedAt)
		)

		advance(1000)
		expect(result.current).toBe(24)

		advance(3000)
		expect(result.current).toBe(21)
	})

	it('rounds a part of a second up, so zero shows only when the time is really up', () => {
		const receivedAt = Date.now()
		const { result } = renderHook(() =>
			useQuestionCountdown(timing, receivedAt)
		)

		advance(24_000)
		expect(result.current).toBe(1)

		advance(1000)
		expect(result.current).toBe(0)
	})

	it('stops counting when the time is up, and never goes below zero', () => {
		const receivedAt = Date.now()
		const { result } = renderHook(() =>
			useQuestionCountdown(timing, receivedAt)
		)

		advance(60_000)

		expect(result.current).toBe(0)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('does not depend on the clock of the device', () => {
		// The device thinks it is 2100: only the time since the question arrived counts.
		vi.setSystemTime(new Date('2100-01-01T00:00:00Z'))
		const receivedAt = Date.now()
		const { result } = renderHook(() =>
			useQuestionCountdown(timing, receivedAt)
		)

		advance(5000)

		expect(result.current).toBe(20)
	})

	it('gives null for a question without a time limit, and starts no timer', () => {
		const { result } = renderHook(() =>
			useQuestionCountdown({ ...timing, endsAtUtc: null }, Date.now())
		)

		expect(result.current).toBeNull()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('gives null when there is no question', () => {
		const { result } = renderHook(() => useQuestionCountdown(null, null))

		expect(result.current).toBeNull()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('starts again from the full time for the next question', () => {
		const firstReceivedAt = Date.now()
		const { result, rerender } = renderHook(
			({ receivedAt }) => useQuestionCountdown(timing, receivedAt),
			{ initialProps: { receivedAt: firstReceivedAt } }
		)
		advance(10_000)
		expect(result.current).toBe(15)

		rerender({ receivedAt: Date.now() })

		expect(result.current).toBe(25)
	})

	it('stops its timer when the component goes away', () => {
		const { unmount } = renderHook(() =>
			useQuestionCountdown(timing, Date.now())
		)
		expect(vi.getTimerCount()).toBe(1)

		unmount()

		expect(vi.getTimerCount()).toBe(0)
	})
})
