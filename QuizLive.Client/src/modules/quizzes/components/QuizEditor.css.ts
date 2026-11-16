import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const editor = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[8]
})
export const questionsSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[4]
})
export const optionRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing[2]
})
export const optionInput = style({ flex: 1, minWidth: 0 })
export const compactAction = style({ alignSelf: 'flex-start' })
export const sectionHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	flexWrap: 'wrap',
	gap: vars.spacing[3]
})
export const formPanel = style({
	width: '100%',
	minWidth: 0,
	maxWidth: '44rem',
	marginInline: 'auto',
	boxSizing: 'border-box',
	padding: vars.spacing[5],
	border: `1px solid ${vars.colors.borderStrong}`,
	borderRadius: vars.radii.lg,
	'@media': { 'screen and (max-width: 480px)': { padding: vars.spacing[3] } }
})
