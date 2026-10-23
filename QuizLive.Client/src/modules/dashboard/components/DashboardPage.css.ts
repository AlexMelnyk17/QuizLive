import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
})

export const loadingStack = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
})
