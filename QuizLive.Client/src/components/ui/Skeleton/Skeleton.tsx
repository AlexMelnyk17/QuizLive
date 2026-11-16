import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { CSSProperties } from 'react'

import cn from 'clsx'

import { skeleton } from '@components/ui/Skeleton/Skeleton.css'

type SkeletonVariants = NonNullable<RecipeVariants<typeof skeleton>>

export type SkeletonProps = SkeletonVariants & {
	className?: string
	style?: CSSProperties
}

export function Skeleton({ className, variant, style }: SkeletonProps) {
	return (
		<span
			className={cn(skeleton({ variant }), className)}
			style={style}
			aria-hidden
		/>
	)
}
