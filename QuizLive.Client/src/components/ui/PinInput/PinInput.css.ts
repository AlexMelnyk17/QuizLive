import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const pinRow = style({
	display: 'inline-flex',
	gap: vars.spacing[2],
})

export const pinCell = recipe({
	base: {
		width: '44px',
		height: '52px',
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surface,
		color: vars.colors.textHeading,
		fontFamily: vars.fonts.mono,
		fontSize: vars.fontSizes.xl,
		fontWeight: vars.fontWeights.semibold,
		textAlign: 'center',
		textTransform: 'uppercase',
		transition: `border-color ${vars.durations.normal}, box-shadow ${vars.durations.normal}`,
		':focus': {
			outline: 'none',
			borderColor: vars.colors.primaryBorder,
			boxShadow: `0 0 0 3px ${vars.colors.primaryMuted}`,
		},
	},
	variants: {
		filled: {
			true: {
				borderColor: vars.colors.primaryBorder,
			},
			false: {},
		},
		invalid: {
			true: {
				borderColor: vars.colors.danger,
			},
			false: {},
		},
	},
	defaultVariants: {
		filled: false,
		invalid: false,
	},
})
