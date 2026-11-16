import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[6]
})

export const quizListFilter = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing[2]
})

// One column on phones, more as the screen grows; cards never get narrower than the screen.
export const quizGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
	gap: vars.spacing[4]
})

export const quizSkeletonCard = style({
	height: '11rem'
})

export const quizEmptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing[3],
	padding: vars.spacing[8],
	textAlign: 'center',
	borderRadius: vars.radii.lg,
	backgroundColor: vars.colors.surface,
	border: `1px solid ${vars.colors.border}`
})
