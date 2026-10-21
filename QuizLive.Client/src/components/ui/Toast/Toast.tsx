import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ReactNode } from 'react'

import cn from 'clsx'

import { toast, toastMessage, toastTitle } from '@components/ui/Toast/Toast.css'

type ToastVariants = NonNullable<RecipeVariants<typeof toast>>

export type ToastProps = ToastVariants & {
	title?: string
	children?: ReactNode
	icon?: ReactNode
	className?: string
}

export function Toast({
	className,
	variant,
	title,
	children,
	icon,
}: ToastProps) {
	return (
		<div className={cn(toast({ variant }), className)} role="status">
			{icon}
			<div>
				{title ? <p className={toastTitle}>{title}</p> : null}
				{children ? <p className={toastMessage}>{children}</p> : null}
			</div>
		</div>
	)
}
