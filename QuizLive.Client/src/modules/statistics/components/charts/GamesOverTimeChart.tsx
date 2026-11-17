import { statsChartColors } from '@modules/statistics/chartColors'
import { StatsBarChart } from '@modules/statistics/components/charts/StatsBarChart'
import { statsXAxisTickCompact } from '@modules/statistics/components/charts/statsChartLayout'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { GamesPerDay } from '@modules/statistics/types'
import { formatDate } from '@utils/formatDate'

export type GamesOverTimeChartProps = {
	points: GamesPerDay[]
	title?: string
}

export function GamesOverTimeChart({
	points,
	title = STATISTICS_CHART_COPY.gamesOverTime,
}: GamesOverTimeChartProps) {
	const data = points.map((point) => ({
		key: point.date,
		label: formatDate(point.date),
		count: point.count,
	}))

	return (
		<StatsBarChart
			title={title}
			data={data}
			dataKey="count"
			name={STATISTICS_CHART_COPY.seriesGames}
			fill={statsChartColors.fill}
			tick={statsXAxisTickCompact}
			xAxisInterval="preserveStartEnd"
		/>
	)
}
