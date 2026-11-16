import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const heading = recipe({
	base: {
		margin: 0,
		fontFamily: vars.fonts.heading,
		fontWeight: vars.fontWeights.medium,
		color: vars.colors.textHeading,
		lineHeight: vars.lineHeights.tight,
	},
	variants: {
		level: {
			1: { fontSize: vars.fontSizes['4xl'], letterSpacing: '-0.03em' },
			2: { fontSize: vars.fontSizes['3xl'], letterSpacing: '-0.02em' },
			3: { fontSize: vars.fontSizes['2xl'] },
			4: { fontSize: vars.fontSizes.xl },
		},
		align: {
			left: { textAlign: 'left' },
			center: { textAlign: 'center' },
			right: { textAlign: 'right' },
		},
	},
	defaultVariants: {
		level: 2,
		align: 'left',
	},
})
