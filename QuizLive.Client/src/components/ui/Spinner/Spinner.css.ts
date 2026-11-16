import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

const spin = keyframes({
	to: { transform: 'rotate(360deg)' },
})

export const spinnerRing = style({
	display: 'inline-block',
	borderRadius: vars.radii.full,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	borderTopColor: 'transparent',
	animation: `${spin} 0.75s linear infinite`,
})

export const spinner = recipe({
	base: [spinnerRing],
	variants: {
		size: {
			sm: { width: '14px', height: '14px', borderWidth: '2px' },
			md: { width: '18px', height: '18px', borderWidth: '2px' },
			lg: { width: '24px', height: '24px', borderWidth: '3px' },
		},
		tone: {
			inherit: { color: 'inherit' },
			primary: { color: vars.colors.primary },
			onPrimary: { color: vars.colors.onPrimary },
			muted: { color: vars.colors.textMuted },
		},
	},
	defaultVariants: {
		size: 'md',
		tone: 'inherit',
	},
})
