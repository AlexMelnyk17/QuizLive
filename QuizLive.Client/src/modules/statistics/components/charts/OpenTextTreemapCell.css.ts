import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

import { statsChartColors } from '@modules/statistics/chartColors'
import { STATISTICS_TREEMAP_LABEL_LINES } from '@modules/statistics/constants'

export const treemapLabelBox = style({
	width: '100%',
	height: '100%',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	boxSizing: 'border-box',
	padding: vars.spacing[1],
	margin: 0,
	overflow: 'hidden',
	color: statsChartColors.textOnFill,
	fontSize: vars.fontSizes.xs,
	fontWeight: vars.fontWeights.normal,
	lineHeight: vars.lineHeights.tight,
	textAlign: 'center',
	wordBreak: 'break-word',
})

export const treemapLabelText = style({
	display: '-webkit-box',
	WebkitLineClamp: STATISTICS_TREEMAP_LABEL_LINES,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})
