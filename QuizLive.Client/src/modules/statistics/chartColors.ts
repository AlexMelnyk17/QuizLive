import { vars } from '@theme/contract.css'

/** Shared categorical fills (donut, treemap, multi-series bars). */
export const statsChartSeries = [
	vars.charts.blue,
	vars.charts.purple,
	vars.charts.green,
	vars.charts.amber,
	vars.charts.red,
	vars.charts.indigo,
	vars.charts.pink,
	vars.charts.teal
] as const

export const statsChartColors = {
	fill: statsChartSeries[0],
	success: statsChartSeries[2],
	stroke: vars.colors.borderStrong,
	surface: vars.colors.surfaceRaised,
	text: vars.colors.textHeading,
	textMuted: vars.colors.textMuted,
	textOnFill: vars.charts.textOnFill
} as const
