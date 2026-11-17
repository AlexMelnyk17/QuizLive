import {
	Area,
	CartesianGrid,
	ComposedChart,
	LabelList,
	Line,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts'

import { statsChartColors } from '@modules/statistics/chartColors'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	statsCartesianGridProps,
	statsChartTooltipProps,
	statsLineChartMargin,
	statsLineXAxisPadding,
	statsXAxisTickDefault,
	statsYAxisProps
} from '@modules/statistics/components/charts/statsChartLayout'
import {
	STATISTICS_AREA_FILL_OPACITY,
	STATISTICS_CHART_COPY,
	STATISTICS_CHART_PERCENT_FONT_SIZE,
	STATISTICS_LINE_DOT_RADIUS,
	STATISTICS_LINE_LABEL_OFFSET,
	STATISTICS_LINE_STROKE_WIDTH,
	STATISTICS_LINE_Y_AXIS_WIDTH,
	STATISTICS_PERCENT_SCALE
} from '@modules/statistics/constants'
import { useStatsChartAnimation } from '@modules/statistics/hooks/useStatsChartAnimation'
import type { QuestionCorrectPoint } from '@modules/statistics/types'
import { formatStatPercent } from '@modules/statistics/utils/formatStatPercent'

export type QuestionCorrectPercentChartProps = {
	points: QuestionCorrectPoint[]
}

export function QuestionCorrectPercentChart({
	points
}: QuestionCorrectPercentChartProps) {
	const chartAnimation = useStatsChartAnimation()

	return (
		<StatsChartCard title={STATISTICS_CHART_COPY.questionCorrectPercent}>
			<ComposedChart data={points} margin={statsLineChartMargin}>
				<CartesianGrid {...statsCartesianGridProps} />
				<XAxis
					dataKey='label'
					tick={statsXAxisTickDefault}
					interval={0}
					padding={statsLineXAxisPadding}
				/>
				<YAxis
					{...statsYAxisProps}
					width={STATISTICS_LINE_Y_AXIS_WIDTH}
					domain={[0, STATISTICS_PERCENT_SCALE]}
				/>
				<Tooltip {...statsChartTooltipProps} />
				<Area
					type='linear'
					dataKey='correctPercent'
					fill={statsChartColors.success}
					fillOpacity={STATISTICS_AREA_FILL_OPACITY}
					stroke='none'
					tooltipType='none'
					legendType='none'
					{...chartAnimation}
				/>
				<Line
					type='linear'
					dataKey='correctPercent'
					name={STATISTICS_CHART_COPY.seriesPercent}
					stroke={statsChartColors.success}
					strokeWidth={STATISTICS_LINE_STROKE_WIDTH}
					dot={{
						fill: statsChartColors.success,
						r: STATISTICS_LINE_DOT_RADIUS
					}}
					{...chartAnimation}
				>
					<LabelList
						dataKey='correctPercent'
						position='top'
						offset={STATISTICS_LINE_LABEL_OFFSET}
						formatter={formatStatPercent}
						fill={statsChartColors.textMuted}
						fontSize={STATISTICS_CHART_PERCENT_FONT_SIZE}
					/>
				</Line>
			</ComposedChart>
		</StatsChartCard>
	)
}
