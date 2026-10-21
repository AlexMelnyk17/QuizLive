import type { RecipeVariants } from '@vanilla-extract/recipes'

import cn from 'clsx'

import { spinner } from '@components/ui/Spinner/Spinner.css'

type SpinnerVariants = NonNullable<RecipeVariants<typeof spinner>>

export type SpinnerProps = SpinnerVariants & {
	className?: string
	label?: string
}

export function Spinner({
	className,
	size,
	tone,
	label = 'Loading',
}: SpinnerProps) {
	return (
		<span
			className={cn(spinner({ size, tone }), className)}
			role="status"
			aria-label={label}
		/>
	)
}
