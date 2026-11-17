import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizDetails = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[6]
})

// Info and actions sit side by side on wide screens and stack on phones.
export const quizDetailsHeader = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: vars.spacing[4]
})

export const quizDetailsInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[2],
	flex: '1 1 20rem',
	minWidth: 0
})

export const quizDetailsTitle = style({
	overflowWrap: 'anywhere'
})

export const quizDetailsText = style({
	overflowWrap: 'anywhere',
	whiteSpace: 'pre-line'
})

export const quizDetailsMeta = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing[2]
})

export const quizDetailsActions = style({
	display: 'flex',
	alignItems: 'flex-start',
	flexWrap: 'wrap',
	gap: vars.spacing[2]
})

export const startGameButton = style({
	':disabled': {
		backgroundColor: vars.colors.success,
		color: vars.colors.onPrimary
	}
})
export const actionWithHint = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: vars.spacing[1],
	maxWidth: '14rem'
})

export const questionList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4],
	margin: 0,
	padding: 0,
	listStyle: 'none'
})

export const questionCard = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[3]
})

export const questionImage = style({
	display: 'block',
	maxWidth: '100%',
	maxHeight: '16rem',
	height: 'auto',
	objectFit: 'contain',
	borderRadius: vars.radii.md
})

// One column on phones, two from tablet width.
export const optionList = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing[2],
	margin: 0,
	padding: 0,
	listStyle: 'none',
	'@media': {
		'screen and (min-width: 768px)': {
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
		}
	}
})

export const optionItem = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing[2],
	padding: `${vars.spacing[2]} ${vars.spacing[3]}`,
	borderRadius: vars.radii.md,
	backgroundColor: vars.colors.surfaceSunken,
	border: `1px solid ${vars.colors.borderStrong}`,
	minWidth: 0,
	overflowWrap: 'anywhere'
})

export const optionItemCorrect = style({
	borderColor: vars.colors.success,
	backgroundColor: vars.colors.successMuted
})

export const quizDetailsEmpty = style({
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

export const quizDetailsSkeletonHeader = style({
	height: '6rem'
})

export const quizDetailsSkeletonQuestion = style({
	height: '9rem'
})

export const deleteDialogActions = style({
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'flex-end',
	gap: vars.spacing[2],
	marginTop: vars.spacing[4]
})
