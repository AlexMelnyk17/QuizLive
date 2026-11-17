import type { RecipeVariants } from '@vanilla-extract/recipes'
import cn from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

import { text } from '@components/ui/Text/Text.css'

type TextVariants = NonNullable<RecipeVariants<typeof text>>

export type TextProps = ComponentPropsWithoutRef<'p'> & TextVariants

export const Text = ({
	className,
	size,
	weight,
	tone,
	align,
	truncate,
	...props
}: TextProps) => (
	<p
		className={cn(text({ size, weight, tone, align, truncate }), className)}
		{...props}
	/>
)
