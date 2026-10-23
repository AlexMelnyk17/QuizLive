import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const panel = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
	alignItems: 'flex-start',
})

export const codeLabel = style({
	fontSize: vars.fontSizes.sm,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading,
})
