import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const badge = recipe({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: vars.spacing[1],
		paddingInline: vars.spacing[2],
		minHeight: '22px',
		fontSize: vars.fontSizes.xs,
		fontWeight: vars.fontWeights.semibold,
		lineHeight: 1,
		borderRadius: vars.radii.md,
		border: '1px solid transparent',
	},
	variants: {
		variant: {
			default: {
				backgroundColor: vars.colors.surface,
				color: vars.colors.textHeading,
				borderColor: vars.colors.border,
			},
			primary: {
				backgroundColor: vars.colors.primaryMuted,
				color: vars.colors.primary,
			},
			success: {
				backgroundColor: vars.colors.successMuted,
				color: vars.colors.success,
			},
			danger: {
				backgroundColor: vars.colors.dangerMuted,
				color: vars.colors.danger,
			},
			warning: {
				backgroundColor: vars.colors.warningMuted,
				color: vars.colors.warning,
			},
			info: {
				backgroundColor: vars.colors.infoMuted,
				color: vars.colors.info,
			},
		},
		pill: {
			true: { borderRadius: vars.radii.full },
			false: {},
		},
	},
	defaultVariants: {
		variant: 'default',
		pill: false,
	},
})
