import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const avatarRoot = style({
	position: 'relative',
	display: 'inline-flex',
	flexShrink: 0,
})

export const avatarImage = recipe({
	base: {
		borderRadius: vars.radii.full,
		objectFit: 'cover',
		backgroundColor: vars.colors.primaryMuted,
		color: vars.colors.primary,
		fontWeight: vars.fontWeights.semibold,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		border: `1px solid ${vars.colors.border}`,
	},
	variants: {
		size: {
			sm: { width: '28px', height: '28px', fontSize: vars.fontSizes.xs },
			md: { width: '36px', height: '36px', fontSize: vars.fontSizes.sm },
			lg: { width: '48px', height: '48px', fontSize: vars.fontSizes.md },
			xl: { width: '64px', height: '64px', fontSize: vars.fontSizes.lg },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export const statusDot = recipe({
	base: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: '10px',
		height: '10px',
		borderRadius: vars.radii.full,
		border: `2px solid ${vars.colors.surfaceRaised}`,
	},
	variants: {
		status: {
			online: { backgroundColor: vars.colors.success },
			playing: { backgroundColor: vars.colors.warning },
			offline: { backgroundColor: vars.colors.textMuted },
		},
		size: {
			sm: { width: '8px', height: '8px' },
			md: { width: '10px', height: '10px' },
			lg: { width: '12px', height: '12px' },
			xl: { width: '14px', height: '14px' },
		},
	},
	defaultVariants: {
		status: 'offline',
		size: 'md',
	},
})
