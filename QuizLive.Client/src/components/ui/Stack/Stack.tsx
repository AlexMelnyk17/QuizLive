import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { stack } from '@components/ui/Stack/Stack.css'
import cn from 'clsx'

type StackVariants = NonNullable<RecipeVariants<typeof stack>>

export type StackProps = ComponentPropsWithoutRef<'div'> & StackVariants

export const Stack = ({
	className,
	direction,
	align,
	justify,
	wrap,
	...props
}: StackProps) => (
	<div
		className={cn(stack({ direction, align, justify, wrap }), className)}
		{...props}
	/>
)
