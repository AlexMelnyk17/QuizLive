import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

// The content of the host page: the dashboard layout puts no space between its children.
export const hostScreen = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
	maxWidth: '40rem'
})

// Buttons that belong together, next to each other, wrapping on a narrow screen.
export const buttonRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing[2]
})

export const dialogBody = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4]
})

export const dialogActions = style({
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'flex-end',
	gap: vars.spacing[2]
})
