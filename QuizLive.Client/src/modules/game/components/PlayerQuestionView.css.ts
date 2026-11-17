import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const countdown = style({
	display: 'flex',
	justifyContent: 'center'
})

export const questionImage = style({
	maxWidth: '100%',
	borderRadius: vars.radii.md
})

export const optionsList = style({
	gap: vars.spacing[3]
})
