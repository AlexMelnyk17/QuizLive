import { vars } from '@theme/contract.css'

import { statsChartColors } from '@modules/statistics/chartColors'
import { STATISTICS_BAR_Y_AXIS_WIDTH } from '@modules/statistics/constants'

export const statsBarChartMargin = {
	top: 8,
	right: 8,
	left: 0,
	bottom: 0,
} as const

export const statsLineChartMargin = {
	top: 32,
	right: 28,
	left: 8,
	bottom: 28,
} as const

export const statsLineXAxisPadding = {
	left: 28,
	right: 28,
} as const

export const statsCartesianGridProps = {
	stroke: statsChartColors.stroke,
	strokeDasharray: '3 3',
	vertical: false,
} as const

export const statsYAxisProps = {
	allowDecimals: false,
	tick: { fill: statsChartColors.textMuted, fontSize: vars.fontSizes.xs },
	width: STATISTICS_BAR_Y_AXIS_WIDTH,
} as const

export const statsXAxisTickDefault = {
	fill: statsChartColors.textMuted,
	fontSize: vars.fontSizes.sm,
} as const

export const statsXAxisTickCompact = {
	fill: statsChartColors.textMuted,
	fontSize: vars.fontSizes.xs,
} as const

export const statsChartTooltipProps = {
	contentStyle: {
		backgroundColor: statsChartColors.surface,
		borderColor: statsChartColors.stroke,
		color: statsChartColors.text,
	},
	labelStyle: { color: statsChartColors.text },
	itemStyle: { color: statsChartColors.textMuted },
} as const
