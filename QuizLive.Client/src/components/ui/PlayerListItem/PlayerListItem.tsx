import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ReactNode } from 'react'

import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import cn from 'clsx'

import {
	playerListItem,
	playerMeta,
	playerName,
	playerScore,
} from '@components/ui/PlayerListItem/PlayerListItem.css'

type PlayerListItemVariants = NonNullable<RecipeVariants<typeof playerListItem>>

export type PlayerListItemProps = PlayerListItemVariants & {
	name: string
	score?: ReactNode
	avatarSrc?: string
	status?: 'online' | 'playing' | 'offline'
	className?: string
}

export function PlayerListItem({
	className,
	name,
	score,
	avatarSrc,
	status = 'online',
	isHost = false,
	isSelf = false,
}: PlayerListItemProps) {
	return (
		<div className={cn(playerListItem({ isHost, isSelf }), className)}>
			<Avatar name={name} src={avatarSrc} size="md" status={status} />
			<div className={playerMeta}>
				<p className={playerName}>{name}</p>
				{isHost ? (
					<Badge variant="primary" pill>
						{'Host'}
					</Badge>
				) : null}
			</div>
			{score !== undefined ? <div className={playerScore}>{score}</div> : null}
		</div>
	)
}
