import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { heading } from '@components/ui/Heading/Heading.css'
import cn from 'clsx'

type HeadingVariants = NonNullable<RecipeVariants<typeof heading>>

export type HeadingProps = Omit<ComponentPropsWithoutRef<'h1'>, 'color'> &
	HeadingVariants

const tagByLevel: Record<
	NonNullable<HeadingVariants['level']>,
	'h1' | 'h2' | 'h3' | 'h4'
> = {
	1: 'h1',
	2: 'h2',
	3: 'h3',
	4: 'h4',
}

export const Heading = ({
	className,
	level = 2,
	align,
	...props
}: HeadingProps) => {
	const Tag = tagByLevel[level ?? 2]
	return (
		<Tag
			className={cn(heading({ level, align }), className)}
			{...props}
		/>
	)
}
