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
	length,
}: DividerProps) {
	const resolvedOrientation = orientation ?? 'horizontal'

	return (
		<hr
			className={cn(divider({ orientation, spacing, length }), className)}
			aria-orientation={resolvedOrientation}
		/>
	)
}
