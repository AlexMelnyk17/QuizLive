import { statsChartColors } from '@modules/statistics/chartColors'

export const statsBarChartMargin = {
	top: 8,
	right: 8,
	left: 0,
	bottom: 0,
} as const

export const statsCartesianGridProps = {
	stroke: statsChartColors.grid,
	strokeDasharray: '3 3',
	vertical: false,
} as const

export const statsYAxisProps = {
	allowDecimals: false,
	tick: { fill: statsChartColors.axis, fontSize: 11 },
	width: 32,
} as const

export const statsXAxisTickDefault = {
	fill: statsChartColors.axis,
	fontSize: 12,
} as const

export const statsXAxisTickCompact = {
	fill: statsChartColors.axis,
	fontSize: 11,
} as const