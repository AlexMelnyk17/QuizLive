import { Cell, Pie, PieChart, type PieLabelRenderProps } from 'recharts'

import {
	statsChartColors,
	statsChartSeries,
} from '@modules/statistics/chartColors'
import { OptionDonutSliceLabel } from '@modules/statistics/components/charts/OptionDonutSliceLabel'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import { statsDonutChartShell } from '@modules/statistics/components/charts/StatsChartCard.css'
import {
	STATISTICS_DONUT_INNER_RADIUS,
	STATISTICS_DONUT_OUTER_RADIUS,
	STATISTICS_CHART_STROKE_WIDTH,
} from '@modules/statistics/constants'
import type { OptionDonutSlice } from '@modules/statistics/types'

export type OptionDonutChartProps = {
	title: string
	slices: OptionDonutSlice[]
}

export function OptionDonutChart({ title, slices }: OptionDonutChartProps) {
	return (
		<StatsChartCard title={title} chartClassName={statsDonutChartShell}>
			<PieChart>
				<Pie
					data={slices}
					dataKey="value"
					nameKey="label"
					innerRadius={STATISTICS_DONUT_INNER_RADIUS}
					outerRadius={STATISTICS_DONUT_OUTER_RADIUS}
					stroke={statsChartColors.stroke}
					strokeWidth={STATISTICS_CHART_STROKE_WIDTH}
					label={(labelProps: PieLabelRenderProps) => (
						<OptionDonutSliceLabel {...labelProps} />
					)}
					labelLine={false}
					isAnimationActive={false}
				>
					{slices.map((slice, index) => (
						<Cell
							key={slice.key}
							fill={statsChartSeries[index % statsChartSeries.length]}
							stroke={statsChartColors.stroke}
							strokeWidth={STATISTICS_CHART_STROKE_WIDTH}
						/>
					))}
				</Pie>
			</PieChart>
		</StatsChartCard>
	)
}
