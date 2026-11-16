import type { HostStats } from '@modules/statistics/types'

export function isHostStatsEmpty(stats: HostStats): boolean {
	return (
		stats.quizzes.total === 0 &&
		stats.games.total === 0 &&
		stats.players.totalJoins === 0
	)
}