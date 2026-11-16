import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { select } from '@components/ui/Select/Select.css'
import cn from 'clsx'

type SelectVariants = NonNullable<RecipeVariants<typeof select>>

export type SelectProps = ComponentPropsWithoutRef<'select'> & SelectVariants

export const Select = ({
	className,
	invalid,
	children,
	...props
}: SelectProps) => (
	<select className={cn(select({ invalid }), className)} {...props}>
		{children}
	</select>
)
