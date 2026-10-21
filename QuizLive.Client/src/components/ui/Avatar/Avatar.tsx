import type { RecipeVariants } from '@vanilla-extract/recipes'

import cn from 'clsx'

import { avatarImage, avatarRoot, statusDot } from '@components/ui/Avatar/Avatar.css'

type AvatarVariants = NonNullable<RecipeVariants<typeof avatarImage>>
type StatusVariants = NonNullable<RecipeVariants<typeof statusDot>>

export type AvatarProps = AvatarVariants & {
	src?: string
	alt?: string
	name?: string
	status?: StatusVariants['status']
	className?: string
}

function getInitials(name?: string) {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function Avatar({
	className,
	size = 'md',
	src,
	alt,
	name,
	status,
}: AvatarProps) {
	const initials = getInitials(name ?? alt)
	return (
		<span className={cn(avatarRoot, className)}>
			<span className={avatarImage({ size })}>
				{src ? (
					<img src={src} alt={alt ?? name ?? 'Avatar'} width="100%" height="100%" />
				) : (
					initials
				)}
			</span>
			{status ? (
				<span className={statusDot({ status, size })} aria-hidden />
			) : null}
		</span>
	)
}
