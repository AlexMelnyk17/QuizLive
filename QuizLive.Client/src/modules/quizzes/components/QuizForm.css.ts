import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
	width: '100%',
	maxWidth: '40rem',
	marginInline: 'auto',
	minWidth: 0
})

export const field = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[1],
	margin: 0,
	padding: 0,
	border: 'none',
	minWidth: 0
})

export const fieldLabel = style({
	padding: 0,
	fontSize: vars.fontSizes.sm,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading
})

export const fieldError = style({
	fontSize: vars.fontSizes.sm,
	color: vars.colors.danger,
	margin: 0
})

// One column on phones, three side by side from tablet width.
export const kindOptions = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing[3],
	'@media': {
		'screen and (min-width: 768px)': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
		}
	}
})

export const kindOption = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[2],
	padding: vars.spacing[3],
	borderRadius: vars.radii.md,
	border: `1px solid ${vars.colors.border}`
})

export const kindOptionSelected = style({
	borderColor: vars.colors.primary,
	backgroundColor: vars.colors.primaryMuted
})

export const formActions = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing[2],
	marginTop: vars.spacing[2]
})
