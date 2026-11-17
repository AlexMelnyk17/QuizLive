import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

const answerColors = {
	a: vars.charts.red,
	b: vars.charts.blue,
	c: vars.charts.amber,
	d: vars.charts.green
} as const

export const answerOption = recipe({
	base: {
		display: 'flex',
		alignItems: 'center',
		gap: vars.spacing[3],
		width: '100%',
		padding: vars.spacing[4],
		borderRadius: vars.radii.lg,
		border: `2px solid ${vars.colors.border}`,
		backgroundColor: vars.colors.surfaceRaised,
		color: vars.colors.textHeading,
		textAlign: 'left',
		cursor: 'pointer',
		transition: `transform ${vars.durations.fast}, border-color ${vars.durations.normal}, box-shadow ${vars.durations.normal}`,
		':hover': {
			transform: 'translateY(-1px)',
			boxShadow: vars.shadows.sm
		},
		':disabled': {
			opacity: 1,
			color: vars.colors.disabledText,
			cursor: 'not-allowed',
			transform: 'none'
		}
	},
	variants: {
		color: {
			a: {},
			b: {},
			c: {},
			d: {}
		},
		state: {
			idle: {},
			selected: {
				borderColor: vars.colors.primary,
				boxShadow: `0 0 0 3px ${vars.colors.primaryMuted}`
			},
			correct: {
				borderColor: vars.colors.success,
				backgroundColor: vars.colors.successMuted
			},
			wrong: {
				borderColor: vars.colors.danger,
				backgroundColor: vars.colors.dangerMuted
			},
			disabled: {
				backgroundColor: vars.colors.disabledBg,
				color: vars.colors.disabledText,
				borderColor: vars.colors.disabledBorder,
				cursor: 'not-allowed'
			}
		}
	},
	compoundVariants: (['a', 'b', 'c', 'd'] as const).map(color => ({
		variants: { color, state: 'idle' as const },
		style: {
			borderLeftWidth: '6px',
			borderLeftColor: answerColors[color]
		}
	})),
	defaultVariants: {
		color: 'a',
		state: 'idle'
	}
})

export const answerLetter = recipe({
	base: {
		width: '36px',
		height: '36px',
		borderRadius: vars.radii.md,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: vars.fontWeights.bold,
		color: vars.charts.textOnFill,
		flexShrink: 0
	},
	variants: {
		color: {
			a: { backgroundColor: answerColors.a },
			b: { backgroundColor: answerColors.b },
			c: { backgroundColor: answerColors.c },
			d: { backgroundColor: answerColors.d }
		}
	},
	defaultVariants: {
		color: 'a'
	}
})

export const answerText = style({
	fontSize: vars.fontSizes.lg,
	fontWeight: vars.fontWeights.medium
})
