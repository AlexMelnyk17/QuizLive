import {
	STAT_DURATION_SECONDS_PER_HOUR,
	STAT_DURATION_SECONDS_PER_MINUTE,
} from '@modules/statistics/constants'

/** Format a duration in whole or fractional seconds for display (e.g. game run length). */
export function formatStatDuration(totalSeconds: number): string {
	if (totalSeconds < STAT_DURATION_SECONDS_PER_MINUTE) {
		return `${Math.round(totalSeconds)} s`
	}

	if (totalSeconds < STAT_DURATION_SECONDS_PER_HOUR) {
		const minutes = Math.floor(
			totalSeconds / STAT_DURATION_SECONDS_PER_MINUTE,
		)
		const seconds = Math.round(
			totalSeconds % STAT_DURATION_SECONDS_PER_MINUTE,
		)
		return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`
	}

	const hours = Math.floor(totalSeconds / STAT_DURATION_SECONDS_PER_HOUR)
	const minutes = Math.floor(
		(totalSeconds % STAT_DURATION_SECONDS_PER_HOUR) /
			STAT_DURATION_SECONDS_PER_MINUTE,
	)
	return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}