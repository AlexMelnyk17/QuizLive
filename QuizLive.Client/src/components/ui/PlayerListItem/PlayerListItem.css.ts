import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const playerListItem = recipe({
	base: {
		display: 'flex',
		alignItems: 'center',
		gap: vars.spacing[3],
		padding: vars.spacing[3],
		borderRadius: vars.radii.md,
		border: `1px solid ${vars.colors.border}`,
		backgroundColor: vars.colors.surfaceRaised,
	},
	variants: {
		isHost: {
			true: {
				borderColor: vars.colors.primaryBorder,
				backgroundColor: vars.colors.primaryMuted,
			},
			false: {},
		},
		isSelf: {
			true: {
				boxShadow: `inset 0 0 0 1px ${vars.colors.primary}`,
			},
			false: {},
		},
	},
	defaultVariants: {
		isHost: false,
		isSelf: false,
	},
})

export const playerMeta = style({
	flex: 1,
	minWidth: 0,
	textAlign: 'left',
})

export const playerName = style({
	margin: 0,
	fontSize: vars.fontSizes.md,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const playerScore = style({
	fontFamily: vars.fonts.mono,
	fontSize: vars.fontSizes.lg,
	fontWeight: vars.fontWeights.semibold,
	color: vars.colors.primary,
})
