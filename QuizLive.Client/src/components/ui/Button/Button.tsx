import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { button } from '@components/ui/Button/Button.css'
import { Spinner } from '@components/ui/Spinner'
import cn from 'clsx'

type ButtonVariants = NonNullable<RecipeVariants<typeof button>>

export type ButtonProps = ComponentPropsWithoutRef<'button'> &
	ButtonVariants & {
		loading?: boolean
		leftIcon?: ReactNode
		rightIcon?: ReactNode
	}

export const Button = ({
	className,
	variant,
	size,
	fullWidth,
	loading = false,
	leftIcon,
	rightIcon,
	disabled,
	children,
	...props
}: ButtonProps) => {
	const isDisabled = disabled || loading

	return (
		<button
			type="button"
			className={cn(button({ variant, size, fullWidth }), className)}
			disabled={isDisabled}
			aria-busy={loading || undefined}
			{...props}
		>
			{loading ? (
				<Spinner
					size={size === 'lg' ? 'md' : 'sm'}
					tone={
						variant === 'primary' || variant === 'danger'
							? 'onPrimary'
							: 'primary'
					}
				/>
			) : (
				leftIcon
			)}
			{loading ? <span aria-hidden>{children}</span> : children}
			{!loading && rightIcon}
		</button>
	)
}
