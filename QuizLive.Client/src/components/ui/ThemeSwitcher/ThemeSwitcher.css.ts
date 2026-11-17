import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const themeSwitcher = style({
	position: 'relative',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	width: '40px',
	height: '40px',
	borderRadius: vars.radii.md,
	border: `1px solid ${vars.colors.border}`,
	backgroundColor: vars.colors.surface,
	color: vars.colors.textHeading,
	':hover': {
		backgroundColor: vars.colors.primaryMuted,
		borderColor: vars.colors.primaryBorder
	},
	':focus-within': {
		outline: `2px solid ${vars.colors.focusRing}`,
		outlineOffset: '2px'
	}
})

export const themeSelect = style({
	position: 'absolute',
	inset: 0,
	width: '100%',
	height: '100%',
	opacity: 0,
	cursor: 'pointer'
})
