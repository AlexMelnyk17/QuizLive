import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const openTextStatsCharts = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	gap: vars.spacing[6],
	width: '100%',
})

export const openTextStatsChartItem = style({
	width: '100%',
})
