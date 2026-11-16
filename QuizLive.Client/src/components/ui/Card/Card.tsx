import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { card } from '@components/ui/Card/Card.css'
import cn from 'clsx'

type CardVariants = NonNullable<RecipeVariants<typeof card>>

export type CardProps = ComponentPropsWithoutRef<'div'> & CardVariants

export const Card = ({
	className,
	variant,
	padding,
	interactive,
	fullWidth,
	...props
}: CardProps) => (
	<div
		className={cn(card({ variant, padding, interactive, fullWidth }), className)}
		{...props}
	/>
)
