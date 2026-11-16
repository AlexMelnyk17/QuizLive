import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ReactNode } from 'react'

import { alert, alertBody, alertTitle } from '@components/ui/Alert/Alert.css'
import cn from 'clsx'

type AlertVariants = NonNullable<RecipeVariants<typeof alert>>

export type AlertProps = AlertVariants & {
	title?: string
	children?: ReactNode
	icon?: ReactNode
	className?: string
}

export const Alert = ({
	className,
	variant,
	title,
	children,
	icon,
}: AlertProps) => (
	<div className={cn(alert({ variant }), className)} role="alert">
		{icon}
		<div>
			{title ? <p className={alertTitle}>{title}</p> : null}
			{children ? <div className={alertBody}>{children}</div> : null}
		</div>
	</div>
)
