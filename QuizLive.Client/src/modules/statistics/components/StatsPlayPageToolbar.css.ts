import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const statsBackButton = style({
	marginBottom: 0,
	minHeight: '28px',
	paddingInline: vars.spacing[2],
	fontSize: vars.fontSizes.xs,
	flexShrink: 0
})

export const statsPlayPageToolbar = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing[4],
	marginBottom: vars.spacing[3],
	width: '100%'
})

export const statsPlayPageToolbarTitle = style({
	flex: '1 1 12rem',
	minWidth: 0
})

export const statsPlayPageToolbarTitleSkeleton = style({
	width: '14rem',
	height: vars.fontSizes['2xl'],
	flex: '1 1 12rem'
})
