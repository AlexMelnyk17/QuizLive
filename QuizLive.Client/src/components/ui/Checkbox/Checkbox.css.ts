import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const checkboxRoot = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing[2],
	cursor: 'pointer',
	userSelect: 'none',
})

export const checkboxControl = recipe({
	base: {
		width: '18px',
		height: '18px',
		borderRadius: vars.radii.sm,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surfaceRaised,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		transition: `border-color ${vars.durations.fast}, background-color ${vars.durations.fast}`,
	},
	variants: {
		checked: {
			true: {
				backgroundColor: vars.colors.primary,
				borderColor: vars.colors.primary,
				color: vars.colors.onPrimary,
			},
			false: {},
		},
		disabled: {
			true: { opacity: 0.5, cursor: 'not-allowed' },
			false: {},
		},
	},
	defaultVariants: {
		checked: false,
		disabled: false,
	},
})

export const checkboxInput = style({
	position: 'absolute',
	opacity: 0,
	width: 0,
	height: 0,
})

export const checkboxLabel = style({
	color: vars.colors.textHeading,
	fontSize: vars.fontSizes.sm,
})
