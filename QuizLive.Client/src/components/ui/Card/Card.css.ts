import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const card = recipe({
	base: {
		borderRadius: vars.radii.lg,
		backgroundColor: vars.colors.surfaceRaised,
		color: vars.colors.text,
		transition: `box-shadow ${vars.durations.normal}, border-color ${vars.durations.normal}, transform ${vars.durations.fast}`,
	},
	variants: {
		variant: {
			elevated: {
				border: `1px solid ${vars.colors.border}`,
				boxShadow: vars.shadows.md,
			},
			outlined: {
				border: `1px solid ${vars.colors.border}`,
				boxShadow: vars.shadows.none,
			},
			ghost: {
				border: '1px solid transparent',
				boxShadow: vars.shadows.none,
				backgroundColor: vars.colors.surface,
			},
		},
		padding: {
			none: { padding: 0 },
			sm: { padding: vars.spacing[3] },
			md: { padding: vars.spacing[4] },
			lg: { padding: vars.spacing[6] },
		},
		interactive: {
			true: {
				cursor: 'pointer',
				':hover': {
					borderColor: vars.colors.primaryBorder,
					boxShadow: vars.shadows.lg,
					transform: 'translateY(-1px)',
				},
			},
			false: {},
		},
		fullWidth: {
			true: { width: '100%' },
			false: {},
		},
	},
	defaultVariants: {
		variant: 'elevated',
		padding: 'md',
		interactive: false,
		fullWidth: false,
	},
})
