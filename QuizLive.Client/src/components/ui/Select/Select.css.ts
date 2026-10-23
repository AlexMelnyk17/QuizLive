import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const select = recipe({
	base: {
		width: '100%',
		minHeight: '40px',
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surface,
		color: vars.colors.textHeading,
		paddingInline: vars.spacing[3],
		fontFamily: vars.fonts.sans,
		fontSize: vars.fontSizes.md,
		accentColor: vars.colors.primary,
		transition: `border-color ${vars.durations.normal}, box-shadow ${vars.durations.normal}`,
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
			},
			false: {},
		},
	},
	defaultVariants: {
		invalid: false,
	},
})
