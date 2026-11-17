import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizRunsHeading = style({
	marginBottom: vars.spacing[4]
})

export const quizRunsList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[2],
	listStyle: 'none',
	margin: 0,
	padding: 0
})

export const quizRunRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing[3],
	padding: vars.spacing[3],
	borderRadius: vars.radii.lg,
	border: `1px solid ${vars.colors.border}`,
	backgroundColor: vars.colors.surface
})

export const quizRunMeta = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing[4]
})
