import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const authPage = style({
	minHeight: '100svh',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing[6],
	boxSizing: 'border-box',
})

export const authCard = style({
	width: '100%',
	maxWidth: '420px',
})

export const authStack = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
})
