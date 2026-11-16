import {
	Bar,
	BarChart,
	CartesianGrid,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { statsChartColors } from '@modules/statistics/chartColors'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	statsBarChartMargin,
	statsCartesianGridProps,
	statsXAxisTickCompact,
	statsYAxisProps,
} from '@modules/statistics/components/charts/statsChartLayout'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { GamesPerDay } from '@modules/statistics/types'
import { formatDate } from '@utils/formatDate'

export type GamesOverTimeChartProps = {
	points: GamesPerDay[]
}

export function GamesOverTimeChart({ points }: GamesOverTimeChartProps) {
	const data = points.map((point) => ({
		...point,
		label: formatDate(point.date),
	}))

	return (
		<StatsChartCard title={STATISTICS_CHART_COPY.gamesOverTime}>
			<BarChart data={data} margin={statsBarChartMargin}>
				<CartesianGrid {...statsCartesianGridProps} />
				<XAxis
					dataKey="label"
					tick={statsXAxisTickCompact}
					interval="preserveStartEnd"
					minTickGap={16}
				/>
				<YAxis {...statsYAxisProps} />
				<Tooltip />
				<Bar
					dataKey="count"
					name={STATISTICS_CHART_COPY.seriesGames}
					fill={statsChartColors.primary}
					isAnimationActive={false}
				/>
			</BarChart>
		</StatsChartCard>
	)
}