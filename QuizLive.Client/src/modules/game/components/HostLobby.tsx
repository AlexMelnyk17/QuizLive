import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { codeBox, gameCode } from '@modules/game/components/HostLobby.css'
import { PlayersList } from '@modules/game/components/PlayersList'
import {
	GAME_CONNECTION_STATE,
	HOST_LOBBY_COPY,
	PLAYER_LOBBY_COPY
} from '@modules/game/constants'
import type {
	GameConnectionStateValue,
	GamePlayerDto
} from '@modules/game/types'

export type HostLobbyProps = {
	quizTitle: string
	code: string
	players: GamePlayerDto[]
	connectionState: GameConnectionStateValue
	// Gives the readable error text, or null when the server accepted the command.
	onStart: () => Promise<string | null>
}

// What the host sees until the game starts: the code to give to the players, who has joined, and the
// button that starts the game. The game cannot start without a player.
export function HostLobby({
	quizTitle,
	code,
	players,
	connectionState,
	onStart
}: HostLobbyProps) {
	const [error, setError] = useState<string | null>(null)
	const [isStarting, setIsStarting] = useState(false)

	const start = async () => {
		setError(null)
		setIsStarting(true)

		const message = await onStart()

		// On success the game moves on by an event and this view goes away, so the button stays busy.
		// Only a refusal gives the button back.
		if (message) {
			setError(message)
			setIsStarting(false)
		}
	}

	return (
		<>
			<Heading level={2}>{quizTitle}</Heading>

			<div className={codeBox}>
				<Text size='sm' tone='muted'>
					{HOST_LOBBY_COPY.codeLabel}
				</Text>
				<p className={gameCode}>{code}</p>
				<Text size='sm' tone='muted'>
					{HOST_LOBBY_COPY.joinHint}
				</Text>
			</div>

			{connectionState === GAME_CONNECTION_STATE.reconnecting ? (
				<Alert variant='warning'>{PLAYER_LOBBY_COPY.reconnecting}</Alert>
			) : null}
			{connectionState === GAME_CONNECTION_STATE.disconnected ? (
				<Alert variant='warning'>{PLAYER_LOBBY_COPY.disconnected}</Alert>
			) : null}

			<Heading level={3}>{PLAYER_LOBBY_COPY.players(players.length)}</Heading>
			<PlayersList players={players} selfPlayerId={null} />

			{error ? <Alert variant='danger'>{error}</Alert> : null}

			<Button
				variant='primary'
				disabled={players.length === 0}
				loading={isStarting}
				onClick={() => void start()}
			>
				{HOST_LOBBY_COPY.start}
			</Button>
		</>
	)
}
