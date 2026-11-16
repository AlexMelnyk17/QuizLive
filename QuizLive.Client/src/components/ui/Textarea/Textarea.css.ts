import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const textarea = recipe({
	base: {
		width: '100%',
		minHeight: '96px',
		resize: 'vertical',
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surface,
		color: vars.colors.textHeading,
		padding: vars.spacing[3],
		fontFamily: vars.fonts.sans,
		lineHeight: vars.lineHeights.relaxed,
		transition: `border-color ${vars.durations.normal}, box-shadow ${vars.durations.normal}`,
		'::placeholder': {
			color: vars.colors.textMuted,
		},
		selectors: {
			'&:focus': {
				outline: 'none',
				borderColor: vars.colors.primaryBorder,
				boxShadow: `0 0 0 3px ${vars.colors.primaryMuted}`,
			},
			'&:focus-visible': {
				outline: 'none',
				borderColor: vars.colors.primaryBorder,
				boxShadow: `0 0 0 3px ${vars.colors.primaryMuted}`,
			},
		},
	},
	variants: {
		invalid: {
			true: {
				borderColor: vars.colors.danger,
				':focus': {
					boxShadow: `0 0 0 3px ${vars.colors.dangerMuted}`,
				},
			},
			false: {},
		},
	},
	defaultVariants: {
		invalid: false,
	},
})
