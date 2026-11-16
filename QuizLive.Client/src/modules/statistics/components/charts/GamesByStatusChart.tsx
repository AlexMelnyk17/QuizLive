import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { gamesByStatusColors } from '@modules/statistics/chartColors'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	statsBarChartMargin,
	statsCartesianGridProps,
	statsXAxisTickDefault,
	statsYAxisProps,
} from '@modules/statistics/components/charts/statsChartLayout'
import {
	GAME_STATUS_LABELS,
	STATISTICS_CHART_COPY,
	STATUS_KEYS,
} from '@modules/statistics/constants'
import type { StatusCounts } from '@modules/statistics/types'

export type GamesByStatusChartProps = {
	counts: StatusCounts
}

export function GamesByStatusChart({ counts }: GamesByStatusChartProps) {
	const data = STATUS_KEYS.map((key) => ({
		key,
		label: GAME_STATUS_LABELS[key],
		value: counts[key],
	}))

	return (
		<StatsChartCard title={STATISTICS_CHART_COPY.gamesByStatus}>
			<BarChart data={data} margin={statsBarChartMargin}>
				<CartesianGrid {...statsCartesianGridProps} />
				<XAxis dataKey="label" tick={statsXAxisTickDefault} />
				<YAxis {...statsYAxisProps} />
				<Tooltip />
				<Bar
					dataKey="value"
					name={STATISTICS_CHART_COPY.seriesGames}
					isAnimationActive={false}
				>
					{data.map((entry, index) => (
						<Cell
							key={entry.key}
							fill={gamesByStatusColors[index % gamesByStatusColors.length]}
						/>
					))}
				</Bar>
			</BarChart>
		</StatsChartCard>
	)
}