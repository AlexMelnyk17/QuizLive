import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const menuRoot = style({ position: 'relative', flexShrink: 0 })
export const menuPanel = style({
	position: 'absolute',
	top: `calc(100% + ${vars.spacing[2]})`,
	right: 0,
	width: '272px',
	maxHeight: 'calc(100dvh - 8rem)',
	overflowY: 'auto',
	maxWidth: 'calc(100vw - 3rem)',
	boxSizing: 'border-box',
	padding: vars.spacing[2],
	backgroundColor: vars.colors.surface,
	color: vars.colors.textHeading,
	border: `1px solid ${vars.colors.border}`,
	borderRadius: vars.radii.lg,
	boxShadow: vars.shadows.lg,
	zIndex: vars.zIndices.dropdown
})
export const menuNavigation = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[1]
})
export const menuLink = style({
	display: 'flex',
	alignItems: 'center',
	minHeight: '44px',
	paddingInline: vars.spacing[3],
	borderRadius: vars.radii.md,
	fontSize: vars.fontSizes.sm,
	fontWeight: vars.fontWeights.medium,
	color: vars.colors.textHeading,
	textDecoration: 'none',
	':hover': { backgroundColor: vars.colors.primaryMuted },
	':focus-visible': {
		outline: `2px solid ${vars.colors.focusRing}`,
		outlineOffset: '-2px'
	},
	selectors: {
		'&[data-status="active"]': {
			backgroundColor: vars.colors.primaryMuted,
			color: vars.colors.primary
		}
	}
})
export const menuAccount = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[3],
	marginTop: vars.spacing[2],
	padding: vars.spacing[3],
	borderTop: `1px solid ${vars.colors.border}`
})
export const menuIdentity = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing[2],
	overflowWrap: 'anywhere',
	minWidth: 0
})
export const menuTheme = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing[3]
})
