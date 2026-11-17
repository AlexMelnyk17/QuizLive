import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const statsPage = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[8],
})

export const statsKpiGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
	gap: vars.spacing[4],
})

export const statsChartGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))',
	gap: vars.spacing[6],
})

export const statsEmptyBanner = style({
	padding: vars.spacing[4],
	borderRadius: vars.radii.lg,
	backgroundColor: vars.colors.surface,
	border: `1px solid ${vars.colors.border}`,
})
