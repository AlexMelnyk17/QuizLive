import { palette } from '@theme/tokens'

/** Shared categorical fills (donut, treemap, multi-series bars). */
export const statsChartSeries = [
	palette.blue500,
	palette.purple600,
	palette.green600,
	palette.amber500,
	palette.red600,
	palette.purple400,
	palette.purple500,
	palette.green500,
] as const

export const statsChartColors = {
	fill: statsChartSeries[0],
	success: statsChartSeries[2],
	stroke: palette.gray700,
	surface: palette.gray800,
	text: palette.gray200,
	textMuted: palette.gray400,
	textOnFill: palette.white,
} as const
