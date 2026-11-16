import { style } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

export const openTextEntriesList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing[2],
	marginTop: vars.spacing[3],
	paddingLeft: vars.spacing[4],
})
