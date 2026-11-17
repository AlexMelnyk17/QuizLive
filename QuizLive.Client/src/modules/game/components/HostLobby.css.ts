import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const codeBox = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing[1],
	padding: vars.spacing[4],
	borderRadius: vars.radii.lg,
	backgroundColor: vars.colors.surfaceSunken
})

export const gameCode = style({
	margin: 0,
	fontFamily: vars.fonts.sans,
	fontSize: vars.fontSizes['4xl'],
	fontWeight: vars.fontWeights.bold,
	letterSpacing: '0.2em',
	color: vars.colors.textHeading
})
