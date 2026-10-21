import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const alert = recipe({
	base: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: vars.spacing[3],
		padding: vars.spacing[3],
		borderRadius: vars.radii.md,
		border: '1px solid transparent',
	},
	variants: {
		variant: {
			info: {
				backgroundColor: vars.colors.infoMuted,
				borderColor: vars.colors.info,
				color: vars.colors.textHeading,
			},
			success: {
				backgroundColor: vars.colors.successMuted,
				borderColor: vars.colors.success,
				color: vars.colors.textHeading,
			},
			warning: {
				backgroundColor: vars.colors.warningMuted,
				borderColor: vars.colors.warning,
				color: vars.colors.textHeading,
			},
			danger: {
				backgroundColor: vars.colors.dangerMuted,
				borderColor: vars.colors.danger,
				color: vars.colors.textHeading,
			},
		},
	},
	defaultVariants: {
		variant: 'info',
	},
})

export const alertTitle = style({
	fontWeight: vars.fontWeights.semibold,
	margin: 0,
})

export const alertBody = style({
	margin: 0,
	fontSize: vars.fontSizes.sm,
	color: vars.colors.text,
})
