import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const dashboardRoot = style({
	minHeight: '100svh',
	display: 'flex',
	flexDirection: 'column',
	padding: vars.spacing[6],
	boxSizing: 'border-box',
	gap: vars.spacing[8]
})

export const dashboardHeader = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing[4],
	paddingBottom: vars.spacing[4],
	borderBottom: `1px solid ${vars.colors.border}`
})

export const dashboardHeaderUser = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing[2]
})

export const dashboardHeaderActions = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing[2]
})

export const dashboardHeaderNav = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing[1]
})

export const dashboardNavLink = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing[2]} ${vars.spacing[3]}`,
	borderRadius: vars.radii.md,
	fontSize: vars.fontSizes.sm,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading,
	textDecoration: 'none',
	transition: `background-color ${vars.durations.normal}`,
	':hover': {
		backgroundColor: vars.colors.primaryMuted
	}
})

export const dashboardMain = style({
	flex: 1
})
