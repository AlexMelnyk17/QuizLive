import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { inputField, inputIcon, inputWrapper } from '@components/ui/Input/Input.css'
import cn from 'clsx'

type InputVariants = NonNullable<RecipeVariants<typeof inputWrapper>>

export type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> &
	InputVariants & {
		leftIcon?: ReactNode
		rightIcon?: ReactNode
	}

export const Input = ({
	className,
	size,
	invalid,
	fullWidth,
	leftIcon,
	rightIcon,
	...props
}: InputProps) => (
	<div className={cn(inputWrapper({ size, invalid, fullWidth }), className)}>
		{leftIcon ? <span className={inputIcon}>{leftIcon}</span> : null}
		<input className={inputField} {...props} />
		{rightIcon ? <span className={inputIcon}>{rightIcon}</span> : null}
	</div>
)
