import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const button = recipe({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: vars.spacing[2],
		borderRadius: vars.radii.md,
		border: '1px solid transparent',
		fontFamily: vars.fonts.sans,
		fontWeight: vars.fontWeights.medium,
		lineHeight: 1,
		cursor: 'pointer',
		transition: `background-color ${vars.durations.normal}, color ${vars.durations.normal}, border-color ${vars.durations.normal}, opacity ${vars.durations.fast}`,
		':disabled': {
			opacity: 0.55,
			cursor: 'not-allowed',
			pointerEvents: 'none',
		},
	},
	variants: {
		variant: {
			primary: {
				backgroundColor: vars.colors.primary,
				color: vars.colors.onPrimary,
				':hover': { backgroundColor: vars.colors.primaryHover },
			},
			secondary: {
				backgroundColor: vars.colors.surface,
				color: vars.colors.textHeading,
				borderColor: vars.colors.border,
				':hover': { borderColor: vars.colors.borderStrong },
			},
			outline: {
				backgroundColor: 'transparent',
				color: vars.colors.primary,
				borderColor: vars.colors.primaryBorder,
				':hover': { backgroundColor: vars.colors.primaryMuted },
			},
			ghost: {
				backgroundColor: 'transparent',
				color: vars.colors.textHeading,
				':hover': { backgroundColor: vars.colors.primaryMuted },
			},
			danger: {
				backgroundColor: vars.colors.danger,
				color: vars.colors.onPrimary,
				':hover': { filter: 'brightness(0.95)' },
			},
		},
		size: {
			sm: {
				minHeight: '32px',
				paddingInline: vars.spacing[3],
				fontSize: vars.fontSizes.sm,
			},
			md: {
				minHeight: '40px',
				paddingInline: vars.spacing[4],
				fontSize: vars.fontSizes.md,
			},
			lg: {
				minHeight: '48px',
				paddingInline: vars.spacing[5],
				fontSize: vars.fontSizes.lg,
			},
		},
		fullWidth: {
			true: { width: '100%' },
			false: {},
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
		fullWidth: false,
	},
})
