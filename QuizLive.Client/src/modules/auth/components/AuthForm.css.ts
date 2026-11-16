import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const formAlert = style({
	marginBottom: vars.spacing[4],
})

export const field = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[1],
})

export const fieldLabel = style({
	fontSize: vars.fontSizes.sm,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading,
})

export const fieldError = style({
	fontSize: vars.fontSizes.sm,
	color: vars.colors.danger,
	margin: 0,
})

export const formActions = style({
	marginTop: vars.spacing[4],
})

export const formFooter = style({
	marginTop: vars.spacing[6],
	textAlign: 'center',
})

export const inlineLink = style({
	color: vars.colors.primary,
	textDecoration: 'underline',
	cursor: 'pointer',
	fontWeight: vars.fontWeights.medium,
})
