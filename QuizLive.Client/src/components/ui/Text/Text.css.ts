import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const truncate = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const text = recipe({
	base: {
		margin: 0,
		fontFamily: vars.fonts.sans,
		lineHeight: vars.lineHeights.normal,
	},
	variants: {
		size: {
			xs: { fontSize: vars.fontSizes.xs },
			sm: { fontSize: vars.fontSizes.sm },
			md: { fontSize: vars.fontSizes.md },
			lg: { fontSize: vars.fontSizes.lg },
			xl: { fontSize: vars.fontSizes.xl },
		},
		weight: {
			normal: { fontWeight: vars.fontWeights.normal },
			medium: { fontWeight: vars.fontWeights.medium },
			semibold: { fontWeight: vars.fontWeights.semibold },
			bold: { fontWeight: vars.fontWeights.bold },
		},
		tone: {
			default: { color: vars.colors.text },
			muted: { color: vars.colors.textMuted },
			heading: { color: vars.colors.textHeading },
			primary: { color: vars.colors.primary },
			success: { color: vars.colors.success },
			danger: { color: vars.colors.danger },
			warning: { color: vars.colors.warning },
			info: { color: vars.colors.info },
		},
		align: {
			left: { textAlign: 'left' },
			center: { textAlign: 'center' },
			right: { textAlign: 'right' },
		},
		truncate: {
			true: {},
			false: {},
		},
	},
	compoundVariants: [
		{
			variants: { truncate: true },
			style: truncate,
		},
	],
	defaultVariants: {
		size: 'md',
		weight: 'normal',
		tone: 'default',
		align: 'left',
		truncate: false,
	},
})
