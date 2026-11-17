import { recipe } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'

export const divider = recipe({
	base: {
		display: 'block',
		border: 'none',
		margin: 0,
		flexShrink: 0,
		backgroundColor: vars.colors.border
	},
	variants: {
		orientation: {
			horizontal: {
				width: '100%',
				height: '1px'
			},
			vertical: {
				width: '1px'
			}
		},
		spacing: {
			none: {},
			sm: {},
			md: {},
			lg: {}
		},
		length: {
			inherit: {},
			short: {}
		}
	},
	compoundVariants: [
		{
			variants: { orientation: 'horizontal', spacing: 'sm' },
			style: { marginBlock: vars.spacing[2] }
		},
		{
			variants: { orientation: 'horizontal', spacing: 'md' },
			style: { marginBlock: vars.spacing[4] }
		},
		{
			variants: { orientation: 'horizontal', spacing: 'lg' },
			style: { marginBlock: vars.spacing[6] }
		},
		{
			variants: { orientation: 'vertical', spacing: 'sm' },
			style: { marginInline: vars.spacing[2] }
		},
		{
			variants: { orientation: 'vertical', spacing: 'md' },
			style: { marginInline: vars.spacing[4] }
		},
		{
			variants: { orientation: 'vertical', spacing: 'lg' },
			style: { marginInline: vars.spacing[6] }
		},
		{
			variants: { orientation: 'vertical', length: 'inherit' },
			style: {
				alignSelf: 'stretch',
				minHeight: '1.25rem'
			}
		},
		{
			variants: { orientation: 'vertical', length: 'short' },
			style: {
				height: '1.75rem',
				alignSelf: 'center'
			}
		}
	],
	defaultVariants: {
		orientation: 'horizontal',
		spacing: 'md',
		length: 'inherit'
	}
})
