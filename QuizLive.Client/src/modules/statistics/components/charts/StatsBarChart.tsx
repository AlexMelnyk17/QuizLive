import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { statsChartColors, statsChartSeries } from '@modules/statistics/chartColors'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	statsBarChartMargin,
	statsCartesianGridProps,
	statsChartTooltipProps,
	statsXAxisTickDefault,
	statsYAxisProps,
} from '@modules/statistics/components/charts/statsChartLayout'
import { STATISTICS_CHART_MIN_TICK_GAP } from '@modules/statistics/constants'
import type { StatsBarRow } from '@modules/statistics/types'

export type StatsBarChartProps = {
	title: string
	data: StatsBarRow[]
	dataKey: string
	name: string
	fill?: string
	colorByIndex?: boolean
	tick?: { fill: string; fontSize: number | string }
	xAxisInterval?: 'preserveStartEnd'
	minTickGap?: number
}

export function StatsBarChart({
	title,
	data,
	dataKey,
	name,
	fill: fillProp,
	colorByIndex,
	tick = statsXAxisTickDefault,
	xAxisInterval,
	minTickGap = STATISTICS_CHART_MIN_TICK_GAP,
}: StatsBarChartProps) {
	const resolveFill = () => {
		if (colorByIndex) {
			return null
		}

		return fillProp ?? statsChartColors.fill
	}

	const fill = resolveFill()

	const renderCells = () => {
		if (!colorByIndex) {
			return null
		}

		return data.map((entry, index) => (
			<Cell
				key={entry.key}
				fill={statsChartSeries[index % statsChartSeries.length]}
			/>
		))
	}

	const renderBar = () => {
		if (fill === null) {
			return (
				<Bar dataKey={dataKey} name={name} isAnimationActive={false}>
					{renderCells()}
				</Bar>
			)
		}

		return (
			<Bar
				dataKey={dataKey}
				name={name}
				fill={fill}
				isAnimationActive={false}
			>
				{renderCells()}
			</Bar>
		)
	}

	return (
		<StatsChartCard title={title}>
			<BarChart data={data} margin={statsBarChartMargin}>
				<CartesianGrid {...statsCartesianGridProps} />
				<XAxis
					dataKey="label"
					tick={tick}
					interval={xAxisInterval}
					minTickGap={minTickGap}
				/>
				<YAxis {...statsYAxisProps} />
				<Tooltip {...statsChartTooltipProps} />
				{renderBar()}
			</BarChart>
		</StatsChartCard>
	)
}
