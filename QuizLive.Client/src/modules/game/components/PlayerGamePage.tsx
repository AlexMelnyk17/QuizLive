import { Navigate } from '@tanstack/react-router'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'

import { Alert } from '@components/ui/Alert'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { PlayerLobby } from '@modules/game/components/PlayerLobby'
import { GameStatus, PLAYER_PAGE_COPY } from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'

import { PATHS } from '@config/routes'

// The page of a player who has joined a game. It connects with the player token. The lobby is shown until
// the host starts the game; the game screens replace the rest of this page step by step.
export function PlayerGamePage() {
	const { hasToken, player, status, players, connectionState, error, leave } =
		usePlayerGame()

	// The token is gone, e.g. the player left the game: there is nothing to show here any more.
	if (!hasToken) return <Navigate to={PATHS.home} replace />

	return (
		<AuthLayout>
			{error ? <Alert variant='danger'>{error}</Alert> : null}
			{player && status === GameStatus.Lobby ? (
				<PlayerLobby
					nickname={player.nickname}
					quizTitle={player.quizTitle}
					code={player.code}
					selfPlayerId={player.playerId}
					players={players}
					connectionState={connectionState}
					onLeave={leave}
				/>
			) : null}
			{player && status !== GameStatus.Lobby ? (
				<>
					<Heading level={2}>
						{PLAYER_PAGE_COPY.joined(player.nickname)}
					</Heading>
					<Text tone='muted'>{player.quizTitle}</Text>
					<Text>{PLAYER_PAGE_COPY.gameCode(player.code)}</Text>
				</>
			) : null}
			{!player && !error ? (
				<Text tone='muted'>{PLAYER_PAGE_COPY.connecting}</Text>
			) : null}
		</AuthLayout>
	)
}
