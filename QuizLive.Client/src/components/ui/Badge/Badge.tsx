import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { badge } from '@components/ui/Badge/Badge.css'
import cn from 'clsx'

type BadgeVariants = NonNullable<RecipeVariants<typeof badge>>

export type BadgeProps = ComponentPropsWithoutRef<'span'> & BadgeVariants

export const Badge = ({ className, variant, pill, ...props }: BadgeProps) => (
	<span className={cn(badge({ variant, pill }), className)} {...props} />
)
