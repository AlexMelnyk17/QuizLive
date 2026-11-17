import { PlayerListItem } from '@components/ui/PlayerListItem'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { playersList } from '@modules/game/components/PlayersList.css'
import { PLAYER_LOBBY_COPY } from '@modules/game/constants'
import type { GamePlayerDto } from '@modules/game/types'

export type PlayersListProps = {
	players: GamePlayerDto[]
	// The player whose screen this is, marked in the list. Null for the host, who is not a player.
	selfPlayerId: number | null
}

export function PlayersList({ players, selfPlayerId }: PlayersListProps) {
	if (players.length === 0) {
		return (
			<Text size='sm' tone='muted'>
				{PLAYER_LOBBY_COPY.noPlayers}
			</Text>
		)
	}

	return (
		<Stack direction='column' role='list' className={playersList}>
			{players.map(player => {
				const isSelf = player.id === selfPlayerId

				return (
					<div role='listitem' key={player.id}>
						<PlayerListItem
							name={
								isSelf
									? `${player.nickname} (${PLAYER_LOBBY_COPY.you})`
									: player.nickname
							}
							isSelf={isSelf}
						/>
					</div>
				)
			})}
		</Stack>
	)
}
