import type { QuestionTimingDto } from '@modules/game/types'
import { parseUtcDate } from '@modules/quizzes/utils/parseUtcDate'

// How many milliseconds of a question are left, counted by the server clock. The server says when the
// question ends and what time it was when it sent the message; the device only measures how long ago the
// message arrived. So a device whose clock is wrong still shows the right time. Null: no time limit.
export function getRemainingMs(
	timing: QuestionTimingDto,
	receivedAtMs: number,
	nowMs: number
): number | null {
	if (timing.endsAtUtc === null) return null

	const leftWhenSent =
		parseUtcDate(timing.endsAtUtc).getTime() -
		parseUtcDate(timing.serverNowUtc).getTime()
	const sinceReceived = nowMs - receivedAtMs

	return Math.max(0, leftWhenSent - sinceReceived)
}
