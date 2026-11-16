import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

const stripeMove = keyframes({
	to: { backgroundPosition: '40px 0' },
})

export const progressTrack = recipe({
	base: {
		width: '100%',
		height: '8px',
		borderRadius: vars.radii.full,
		backgroundColor: vars.colors.surface,
		overflow: 'hidden',
		border: `1px solid ${vars.colors.border}`,
	},
	variants: {
		size: {
			sm: { height: '6px' },
			md: { height: '8px' },
			lg: { height: '12px' },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export const progressFill = recipe({
	base: {
		height: '100%',
		borderRadius: vars.radii.full,
		transition: `width ${vars.durations.normal}`,
	},
	variants: {
		variant: {
			primary: { backgroundColor: vars.colors.primary },
			success: { backgroundColor: vars.colors.success },
			danger: { backgroundColor: vars.colors.danger },
			warning: { backgroundColor: vars.colors.warning },
		},
		striped: {
			true: {
				backgroundImage:
					'linear-gradient(45deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)',
				backgroundSize: '20px 20px',
			},
			false: {},
		},
		animated: {
			true: {
				animation: `${stripeMove} 1s linear infinite`,
			},
			false: {},
		},
	},
	defaultVariants: {
		variant: 'primary',
		striped: false,
		animated: false,
	},
})

export const progressLabel = style({
	marginTop: vars.spacing[1],
	fontSize: vars.fontSizes.xs,
	color: vars.colors.textMuted,
	textAlign: 'right',
})
