import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const statsChartHeading = style({
	marginBottom: vars.spacing[4]
})

export const statsChartShell = style({
	width: '100%',
	height: '280px'
})

export const statsDonutChartShell = style({
	width: '100%',
	height: '380px'
})

export const openTextChartTitle = style({
	fontWeight: vars.fontWeights.normal,
	fontSize: vars.fontSizes.md
})
