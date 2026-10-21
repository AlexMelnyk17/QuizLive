import type { RecipeVariants } from '@vanilla-extract/recipes'

import cn from 'clsx'

import { divider } from '@components/ui/Divider/Divider.css'

type DividerVariants = NonNullable<RecipeVariants<typeof divider>>

export type DividerProps = DividerVariants & {
	className?: string
}

export function Divider({
	className,
	orientation,
	spacing,
}: DividerProps) {
	return (
		<hr
			className={cn(divider({ orientation, spacing }), className)}
			aria-orientation={orientation ?? 'horizontal'}
		/>
	)
}
