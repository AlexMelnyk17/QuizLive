import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const iconButtonSize = recipe({
	variants: {
		size: {
			sm: { width: '32px', minHeight: '32px', padding: 0 },
			md: { width: '40px', minHeight: '40px', padding: 0 },
			lg: { width: '48px', minHeight: '48px', padding: 0 },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export const iconButtonBase = style({
	aspectRatio: '1',
	flexShrink: 0,
})
