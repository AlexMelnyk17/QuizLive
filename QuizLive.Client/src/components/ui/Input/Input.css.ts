import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const inputWrapper = recipe({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: vars.spacing[2],
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surface,
		color: vars.colors.textHeading,
		transition: `border-color ${vars.durations.normal}, box-shadow ${vars.durations.normal}`,
		':focus-within': {
			borderColor: vars.colors.primaryBorder,
			boxShadow: `0 0 0 3px ${vars.colors.primaryMuted}`,
		},
	},
	variants: {
		size: {
			sm: {
				minHeight: '32px',
				paddingInline: vars.spacing[3],
				fontSize: vars.fontSizes.sm,
			},
			md: {
				minHeight: '40px',
				paddingInline: vars.spacing[3],
				fontSize: vars.fontSizes.md,
			},
			lg: {
				minHeight: '48px',
				paddingInline: vars.spacing[4],
				fontSize: vars.fontSizes.lg,
			},
		},
		invalid: {
			true: {
				borderColor: vars.colors.danger,
				':focus-within': {
					boxShadow: `0 0 0 3px ${vars.colors.dangerMuted}`,
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
		size: 'md',
		invalid: false,
		fullWidth: false,
	},
})

export const inputField = style({
	flex: 1,
	minWidth: 0,
	border: 'none',
	background: 'transparent',
	color: 'inherit',
	padding: 0,
	outline: 'none',
	boxShadow: 'none',
	selectors: {
		'&:focus': {
			outline: 'none',
			boxShadow: 'none',
		},
		'&:focus-visible': {
			outline: 'none',
			boxShadow: 'none',
		},
	},
	'::placeholder': {
		color: vars.colors.textMuted,
	},
})

export const inputIcon = style({
	display: 'inline-flex',
	color: vars.colors.textMuted,
	flexShrink: 0,
})
