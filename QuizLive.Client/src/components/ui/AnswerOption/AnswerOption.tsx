import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import cn from 'clsx'

import { answerLetter, answerOption, answerText } from '@components/ui/AnswerOption/AnswerOption.css'

type AnswerVariants = NonNullable<RecipeVariants<typeof answerOption>>

const letters = ['A', 'B', 'C', 'D'] as const

export type AnswerOptionProps = Omit<
	ComponentPropsWithoutRef<'button'>,
	'children'
> &
	AnswerVariants & {
		index: number
		children: ReactNode
	}

function getColor(index: number): NonNullable<AnswerVariants['color']> {
	const map = ['a', 'b', 'c', 'd'] as const
	return map[index] ?? 'a'
}

export function AnswerOption({
	className,
	index,
	children,
	state = 'idle',
	color,
	disabled,
	...props
}: AnswerOptionProps) {
	const resolvedColor = color ?? getColor(index)
	const letter = letters[index] ?? 'A'
	const isDisabled = disabled || state === 'disabled'

	return (
		<button
			type="button"
			className={cn(
				answerOption({ color: resolvedColor, state }),
				className
			)}
			disabled={isDisabled}
			{...props}
		>
			<span className={answerLetter({ color: resolvedColor })}>{letter}</span>
			<span className={answerText}>{children}</span>
		</button>
	)
}
