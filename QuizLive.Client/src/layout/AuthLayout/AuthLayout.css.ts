import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const authPage = style({
	minHeight: '100svh',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[6],
	padding: vars.spacing[6],
	boxSizing: 'border-box'
})

export const authToolbar = style({
	display: 'flex',
	justifyContent: 'flex-end'
})
export const authContent = style({
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
	paddingBottom: vars.spacing[12]
})

export const authCard = style({
	width: '100%',
	maxWidth: '420px'
})

export const authStack = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4]
})
