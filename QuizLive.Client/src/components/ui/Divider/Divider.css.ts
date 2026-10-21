import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const divider = recipe({
	base: {
		border: 'none',
		margin: 0,
		flexShrink: 0,
		backgroundColor: vars.colors.border,
	},
	variants: {
		orientation: {
			horizontal: {
				width: '100%',
				height: '1px',
			},
			vertical: {
				width: '1px',
				height: '100%',
				alignSelf: 'stretch',
			},
		},
		spacing: {
			none: {},
			sm: {},
			md: {},
			lg: {},
		},
	},
	compoundVariants: [
		{
			variants: { orientation: 'horizontal', spacing: 'sm' },
			style: { marginBlock: vars.spacing[2] },
		},
		{
			variants: { orientation: 'horizontal', spacing: 'md' },
			style: { marginBlock: vars.spacing[4] },
		},
		{
			variants: { orientation: 'horizontal', spacing: 'lg' },
			style: { marginBlock: vars.spacing[6] },
		},
		{
			variants: { orientation: 'vertical', spacing: 'sm' },
			style: { marginInline: vars.spacing[2] },
		},
		{
			variants: { orientation: 'vertical', spacing: 'md' },
			style: { marginInline: vars.spacing[4] },
		},
		{
			variants: { orientation: 'vertical', spacing: 'lg' },
			style: { marginInline: vars.spacing[6] },
		},
	],
	defaultVariants: {
		orientation: 'horizontal',
		spacing: 'md',
	},
})
