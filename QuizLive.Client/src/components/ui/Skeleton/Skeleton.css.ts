import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

const pulse = keyframes({
	'0%, 100%': { opacity: 1 },
	'50%': { opacity: 0.45 },
})

export const skeletonBase = style({
	backgroundColor: vars.colors.border,
	animation: `${pulse} 1.4s ease-in-out infinite`,
})

export const skeleton = recipe({
	base: [skeletonBase],
	variants: {
		variant: {
			text: {
				height: '1em',
				width: '100%',
				borderRadius: vars.radii.sm,
			},
			rect: {
				width: '100%',
				height: '80px',
				borderRadius: vars.radii.md,
			},
			circle: {
				borderRadius: vars.radii.full,
				width: '40px',
				height: '40px',
			},
		},
	},
	defaultVariants: {
		variant: 'text',
	},
})
