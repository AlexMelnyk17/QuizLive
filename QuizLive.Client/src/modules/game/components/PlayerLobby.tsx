import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { PlayersList } from '@modules/game/components/PlayersList'
import {
	GAME_CONNECTION_STATE,
	PLAYER_LOBBY_COPY,
	PLAYER_PAGE_COPY
} from '@modules/game/constants'
import type {
	GameConnectionStateValue,
	GamePlayerDto
} from '@modules/game/types'

export type PlayerLobbyProps = {
	nickname: string
	quizTitle: string
	code: string
	selfPlayerId: number
	players: GamePlayerDto[]
	connectionState: GameConnectionStateValue
	onLeave: () => void
}

// What a player sees until the host starts the game: who they are, the game, who else has joined, and
// whether the connection is alive. The list of players grows without a reload.
export function PlayerLobby({
	nickname,
	quizTitle,
	code,
	selfPlayerId,
	players,
	connectionState,
	onLeave
}: PlayerLobbyProps) {
	return (
		<>
			<Heading level={2}>{PLAYER_PAGE_COPY.joined(nickname)}</Heading>
			<Text tone='muted'>{quizTitle}</Text>
			<Text>{PLAYER_PAGE_COPY.gameCode(code)}</Text>

			<Alert variant='info'>{PLAYER_LOBBY_COPY.waitingForHost}</Alert>

			{connectionState === GAME_CONNECTION_STATE.reconnecting ? (
				<Alert variant='warning'>{PLAYER_LOBBY_COPY.reconnecting}</Alert>
			) : null}
			{connectionState === GAME_CONNECTION_STATE.disconnected ? (
				<Alert variant='warning'>{PLAYER_LOBBY_COPY.disconnected}</Alert>
			) : null}

			<Heading level={3}>{PLAYER_LOBBY_COPY.players(players.length)}</Heading>
			<PlayersList players={players} selfPlayerId={selfPlayerId} />

			<Button variant='secondary' onClick={onLeave}>
				{PLAYER_LOBBY_COPY.leave}
			</Button>
		</>
	)
}
