import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const countdownRoot = recipe({
	base: {
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	variants: {
		size: {
			sm: { width: '56px', height: '56px' },
			md: { width: '80px', height: '80px' },
			lg: { width: '112px', height: '112px' },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export const countdownSvg = style({
	transform: 'rotate(-90deg)',
})

export const countdownLabel = recipe({
	base: {
		position: 'absolute',
		fontFamily: vars.fonts.mono,
		fontWeight: vars.fontWeights.semibold,
		color: vars.colors.textHeading,
	},
	variants: {
		size: {
			sm: { fontSize: vars.fontSizes.sm },
			md: { fontSize: vars.fontSizes.lg },
			lg: { fontSize: vars.fontSizes['2xl'] },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})
