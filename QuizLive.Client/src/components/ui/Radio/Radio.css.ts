import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const radioRoot = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing[2],
	cursor: 'pointer',
	userSelect: 'none',
})

export const radioControl = recipe({
	base: {
		width: '18px',
		height: '18px',
		borderRadius: vars.radii.full,
		border: `1px solid ${vars.colors.borderStrong}`,
		backgroundColor: vars.colors.surfaceRaised,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	variants: {
		checked: {
			true: {
				borderColor: vars.colors.primary,
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

export const radioDot = style({
	width: '8px',
	height: '8px',
	borderRadius: vars.radii.full,
	backgroundColor: vars.colors.primary,
})

export const radioInput = style({
	position: 'absolute',
	opacity: 0,
	width: 0,
	height: 0,
})

export const radioLabel = style({
	color: vars.colors.textHeading,
	fontSize: vars.fontSizes.sm,
})
