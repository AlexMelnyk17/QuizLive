import { useEffect, useState } from 'react'

import { COUNTDOWN_TICK_MS, MS_PER_SECOND } from '@modules/game/constants'
import type { QuestionTimingDto } from '@modules/game/types'
import { getRemainingMs } from '@modules/game/utils/getRemainingMs'

// The seconds left of a question, counting down once a second, or null when there is nothing to count: no
// question, or a question without a time limit. The time is counted by the server clock (getRemainingMs), so
// a device with a wrong clock shows the right time. The timer stops by itself when the time is up.
export function useQuestionCountdown(
	timing: QuestionTimingDto | null,
	receivedAtMs: number | null
): number | null {
	const [nowMs, setNowMs] = useState(() => Date.now())

	useEffect(() => {
		if (!timing || receivedAtMs === null || timing.endsAtUtc === null) return

		const timer = setInterval(() => {
			const now = Date.now()

			setNowMs(now)

			if ((getRemainingMs(timing, receivedAtMs, now) ?? 0) <= 0) {
				clearInterval(timer)
			}
		}, COUNTDOWN_TICK_MS)

		return () => clearInterval(timer)
	}, [timing, receivedAtMs])

	if (!timing || receivedAtMs === null) return null

	// "Now" is never before the arrival: right after a new question the last tick is still from the old one.
	const remainingMs = getRemainingMs(
		timing,
		receivedAtMs,
		Math.max(nowMs, receivedAtMs)
	)

	return remainingMs === null ? null : Math.ceil(remainingMs / MS_PER_SECOND)
}
