import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const homePage = style({
	minHeight: '100svh',
	padding: vars.spacing[6],
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[8],
})

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
})

export const hostSection = style({
	paddingTop: vars.spacing[6],
	borderTop: `1px solid ${vars.colors.border}`,
})

export const inlineLink = style({
	color: vars.colors.primary,
	textDecoration: 'underline',
	fontWeight: vars.fontWeights.medium,
})
