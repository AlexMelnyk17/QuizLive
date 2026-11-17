import { Cell, Pie, PieChart, type PieLabelRenderProps } from 'recharts'

import {
	statsChartColors,
	statsChartSeries
} from '@modules/statistics/chartColors'
import { OptionDonutSliceLabel } from '@modules/statistics/components/charts/OptionDonutSliceLabel'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import { statsDonutChartShell } from '@modules/statistics/components/charts/StatsChartCard.css'
import {
	STATISTICS_CHART_STROKE_WIDTH,
	STATISTICS_DONUT_INNER_RADIUS,
	STATISTICS_DONUT_OUTER_RADIUS
} from '@modules/statistics/constants'
import { useStatsChartAnimation } from '@modules/statistics/hooks/useStatsChartAnimation'
import type { OptionDonutSlice } from '@modules/statistics/types'

export type OptionDonutChartProps = {
	title: string
	slices: OptionDonutSlice[]
}

export function OptionDonutChart({ title, slices }: OptionDonutChartProps) {
	const chartAnimation = useStatsChartAnimation()

	return (
		<StatsChartCard title={title} chartClassName={statsDonutChartShell}>
			<PieChart>
				<Pie
					data={slices}
					dataKey='value'
					nameKey='label'
					innerRadius={STATISTICS_DONUT_INNER_RADIUS}
					outerRadius={STATISTICS_DONUT_OUTER_RADIUS}
					stroke={statsChartColors.stroke}
					strokeWidth={STATISTICS_CHART_STROKE_WIDTH}
					label={(labelProps: PieLabelRenderProps) => (
						<OptionDonutSliceLabel
							cx={
								typeof labelProps.cx === 'number' ||
								typeof labelProps.cx === 'string'
									? labelProps.cx
									: undefined
							}
							cy={
								typeof labelProps.cy === 'number' ||
								typeof labelProps.cy === 'string'
									? labelProps.cy
									: undefined
							}
							midAngle={
								typeof labelProps.midAngle === 'number'
									? labelProps.midAngle
									: undefined
							}
							outerRadius={
								typeof labelProps.outerRadius === 'number' ||
								typeof labelProps.outerRadius === 'string'
									? labelProps.outerRadius
									: undefined
							}
							name={
								typeof labelProps.name === 'string'
									? labelProps.name
									: undefined
							}
							percent={
								typeof labelProps.percent === 'number'
									? labelProps.percent
									: undefined
							}
						/>
					)}
					labelLine={false}
					{...chartAnimation}
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
