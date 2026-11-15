import type { HostStats } from '@modules/statistics/types'

export function isHostStatsEmpty(stats: HostStats): boolean {
	return (
		stats.quizzes.total === 0 &&
		stats.games.total === 0 &&
		stats.players.totalJoins === 0
	)
}

export function formatStatDecimal(value: number): string {
	return value.toLocaleString(undefined, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})
}

export function formatStatInteger(value: number): string {
	return value.toLocaleString()
}