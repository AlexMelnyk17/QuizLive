import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const quizCard = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[3],
	height: '100%',
	position: 'relative',
	transition: `transform ${vars.durations.fast}, box-shadow ${vars.durations.fast}`,
	selectors: {
		'&:has(button):hover': { transform: 'scale(1.015)' },
		'&:has(button):active': { transform: 'scale(1.025)' },
		'&:focus-within': {
			outline: `2px solid ${vars.colors.focusRing}`,
			outlineOffset: '2px'
		}
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
			selectors: {
				'&:has(button):hover': { transform: 'none' },
				'&:has(button):active': { transform: 'none' }
			}
		}
	}
})

export const quizCardHeader = style({
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: vars.spacing[2]
})

// Long titles without spaces must wrap instead of widening the card on phones.
export const quizCardTitle = style({
	overflowWrap: 'anywhere'
})

export const quizCardTitleButton = style({
	padding: 0,
	border: 'none',
	background: 'none',
	font: 'inherit',
	color: 'inherit',
	textAlign: 'left',
	cursor: 'pointer',
	':after': { content: '""', position: 'absolute', inset: 0 },
	':hover': {
		textDecoration: 'underline'
	}
})

export const quizCardDescription = style({
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',
	overflowWrap: 'anywhere'
})

export const quizCardMeta = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing[2]
})
