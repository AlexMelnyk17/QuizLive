import type { LucideIcon } from 'lucide-react'

import cn from 'clsx'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<IconSize, number> = {
	xs: 14,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32,
}

export type IconProps = {
	icon: LucideIcon
	size?: IconSize
	className?: string
	'aria-hidden'?: boolean
}

export function Icon({
	icon: LucideComponent,
	size = 'md',
	className,
	'aria-hidden': ariaHidden = true,
}: IconProps) {
	const pixelSize = sizeMap[size]
	return (
		<LucideComponent
			size={pixelSize}
			className={cn(className)}
			aria-hidden={ariaHidden}
		/>
	)
}
