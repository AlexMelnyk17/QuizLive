import { vars } from '@theme/contract.css'

import { statsChartColors } from '@modules/statistics/chartColors'
import {
	STATISTICS_CHART_PERCENT_FONT_SIZE,
	STATISTICS_CHART_STROKE_WIDTH,
	STATISTICS_DONUT_LABEL_DEGREES_IN_RADIAN,
	STATISTICS_DONUT_LABEL_FONT_SIZE,
	STATISTICS_DONUT_LABEL_LINE_HEIGHT,
	STATISTICS_DONUT_LABEL_LINE_OUTSET,
	STATISTICS_DONUT_LABEL_MIN_PERCENT,
	STATISTICS_DONUT_LABEL_OFFSET,
	STATISTICS_DONUT_LABEL_TRUNCATE,
	STATISTICS_PERCENT_SCALE
} from '@modules/statistics/constants'
import { formatStatPercent } from '@modules/statistics/utils/formatStatPercent'
import { truncateLabel } from '@modules/statistics/utils/truncateLabel'

export type OptionDonutSliceLabelProps = {
	cx?: number | string
	cy?: number | string
	midAngle?: number
	outerRadius?: number | string
	name?: string
	percent?: number
}

const RADIAN = Math.PI / STATISTICS_DONUT_LABEL_DEGREES_IN_RADIAN

export function OptionDonutSliceLabel({
	cx,
	cy,
	midAngle = 0,
	outerRadius,
	name = '',
	percent = 0
}: OptionDonutSliceLabelProps) {
	const centerX = Number(cx ?? 0)
	const centerY = Number(cy ?? 0)
	const outer = Number(outerRadius ?? 0)
	const percentValue = percent * STATISTICS_PERCENT_SCALE

	if (percentValue < STATISTICS_DONUT_LABEL_MIN_PERCENT) {
		return null
	}

	const sin = Math.sin(-midAngle * RADIAN)
	const cos = Math.cos(-midAngle * RADIAN)
	const startX = centerX + outer * cos
	const startY = centerY + outer * sin
	const midX = centerX + (outer + STATISTICS_DONUT_LABEL_LINE_OUTSET) * cos
	const midY = centerY + (outer + STATISTICS_DONUT_LABEL_LINE_OUTSET) * sin
	const isRight = cos >= 0
	const endX = midX + (isRight ? 1 : -1) * STATISTICS_DONUT_LABEL_OFFSET
	const endY = midY
	const textAnchor = isRight ? 'start' : 'end'
	const label = truncateLabel(name, STATISTICS_DONUT_LABEL_TRUNCATE)

	return (
		<g>
			<polyline
				points={`${startX},${startY} ${midX},${midY} ${endX},${endY}`}
				fill='none'
				stroke={statsChartColors.stroke}
				strokeWidth={STATISTICS_CHART_STROKE_WIDTH}
			/>
			<text
				x={endX}
				y={endY}
				textAnchor={textAnchor}
				dominantBaseline='central'
			>
				<tspan
					x={endX}
					dy={-STATISTICS_DONUT_LABEL_LINE_HEIGHT / 2}
					fill={statsChartColors.text}
					fontSize={STATISTICS_DONUT_LABEL_FONT_SIZE}
					fontWeight={vars.fontWeights.medium}
				>
					{label}
				</tspan>
				<tspan
					x={endX}
					dy={STATISTICS_DONUT_LABEL_LINE_HEIGHT}
					fill={statsChartColors.textMuted}
					fontSize={STATISTICS_CHART_PERCENT_FONT_SIZE}
					fontWeight={vars.fontWeights.normal}
				>
					{formatStatPercent(percentValue)}
				</tspan>
			</text>
		</g>
	)
}
