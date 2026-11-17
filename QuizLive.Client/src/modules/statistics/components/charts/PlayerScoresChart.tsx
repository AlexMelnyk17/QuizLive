import { statsChartColors } from '@modules/statistics/chartColors'
import { StatsBarChart } from '@modules/statistics/components/charts/StatsBarChart'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { GamePlayerStats } from '@modules/statistics/types'

export type PlayerScoresChartProps = {
	players: GamePlayerStats[]
}

export function PlayerScoresChart({ players }: PlayerScoresChartProps) {
	const data = players.map((player) => ({
		key: String(player.playerId),
		label: player.nickname,
		totalPoints: player.totalPoints ?? 0,
	}))

	return (
		<StatsBarChart
			title={STATISTICS_CHART_COPY.playerScores}
			data={data}
			dataKey="totalPoints"
			name={STATISTICS_CHART_COPY.seriesPoints}
			fill={statsChartColors.fill}
		/>
	)
}
