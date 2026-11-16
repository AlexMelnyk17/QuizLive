import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const modalOverlay = style({
	position: 'fixed',
	inset: 0,
	backgroundColor: vars.colors.overlay,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing[4],
	zIndex: vars.zIndices.modal,
})

export const modalPanel = recipe({
	base: {
		width: '100%',
		maxHeight: 'min(90vh, 720px)',
		overflow: 'auto',
		borderRadius: vars.radii.lg,
		backgroundColor: vars.colors.surfaceRaised,
		border: `1px solid ${vars.colors.border}`,
		boxShadow: vars.shadows.lg,
		padding: vars.spacing[5],
	},
	variants: {
		size: {
			sm: { maxWidth: '360px' },
			md: { maxWidth: '520px' },
			lg: { maxWidth: '720px' },
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

export const modalHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing[3],
	marginBottom: vars.spacing[4],
})

export const modalTitle = style({
	margin: 0,
	fontSize: vars.fontSizes.xl,
	fontWeight: vars.fontWeights.semibold,
	color: vars.colors.textHeading,
})
