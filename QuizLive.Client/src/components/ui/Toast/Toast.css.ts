import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const toast = recipe({
	base: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: vars.spacing[3],
		minWidth: '280px',
		maxWidth: '420px',
		padding: vars.spacing[3],
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.border}`,
		backgroundColor: vars.colors.surfaceRaised,
		boxShadow: vars.shadows.md,
	},
	variants: {
		variant: {
			default: {},
			success: {
				borderColor: vars.colors.success,
			},
			danger: {
				borderColor: vars.colors.danger,
			},
			warning: {
				borderColor: vars.colors.warning,
			},
			info: {
				borderColor: vars.colors.info,
			},
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

export const toastTitle = style({
	margin: 0,
	fontWeight: vars.fontWeights.semibold,
	color: vars.colors.textHeading,
})

export const toastMessage = style({
	margin: 0,
	fontSize: vars.fontSizes.sm,
	color: vars.colors.text,
})
