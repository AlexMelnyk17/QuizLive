import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { button } from '@components/ui/Button/Button.css'
import {
	iconButtonBase,
	iconButtonSize,
} from '@components/ui/IconButton/IconButton.css'
import { Spinner } from '@components/ui/Spinner'
import cn from 'clsx'

type ButtonVariants = NonNullable<RecipeVariants<typeof button>>

export type IconButtonProps = Omit<
	ComponentPropsWithoutRef<'button'>,
	'children'
> &
	Pick<ButtonVariants, 'variant' | 'size'> & {
		'aria-label': string
		icon: ReactNode
		loading?: boolean
	}

export const IconButton = ({
	className,
	variant = 'ghost',
	size = 'md',
	loading = false,
	icon,
	disabled,
	'aria-label': ariaLabel,
	...props
}: IconButtonProps) => {
	const isDisabled = disabled || loading

	return (
		<button
			type="button"
			className={cn(
				button({ variant, size, fullWidth: false }),
				iconButtonSize({ size }),
				iconButtonBase,
				className
			)}
			disabled={isDisabled}
			aria-label={ariaLabel}
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
				icon
			)}
		</button>
	)
}
