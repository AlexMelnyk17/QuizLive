import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const switchRoot = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing[2],
	cursor: 'pointer',
	userSelect: 'none',
})

export const switchTrack = recipe({
	base: {
		width: '42px',
		height: '24px',
		borderRadius: vars.radii.full,
		padding: '2px',
		display: 'inline-flex',
		alignItems: 'center',
		transition: `background-color ${vars.durations.normal}`,
	},
	variants: {
		checked: {
			true: { backgroundColor: vars.colors.primary },
			false: { backgroundColor: vars.colors.borderStrong },
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

export const switchThumb = recipe({
	base: {
		width: '20px',
		height: '20px',
		borderRadius: vars.radii.full,
		backgroundColor: vars.colors.surfaceRaised,
		transition: `transform ${vars.durations.normal}`,
	},
	variants: {
		checked: {
			true: { transform: 'translateX(18px)' },
			false: { transform: 'translateX(0)' },
		},
	},
	defaultVariants: {
		checked: false,
	},
})

export const switchInput = style({
	position: 'absolute',
	opacity: 0,
	width: 0,
	height: 0,
})

export const switchLabel = style({
	color: vars.colors.textHeading,
	fontSize: vars.fontSizes.sm,
})
