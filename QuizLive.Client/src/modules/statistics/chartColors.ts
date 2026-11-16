import { palette } from '@theme/tokens'

export const statsChartColors = {
	primary: palette.purple500,
	info: palette.blue500,
	success: palette.green500,
	warning: palette.amber500,
	axis: palette.gray400,
	grid: palette.gray200,
} as const

export const gamesByKindColors = [
	statsChartColors.primary,
	statsChartColors.info,
	statsChartColors.success,
] as const