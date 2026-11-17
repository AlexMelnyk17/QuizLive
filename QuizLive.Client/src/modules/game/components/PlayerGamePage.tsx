import { Navigate } from '@tanstack/react-router'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'

import { Alert } from '@components/ui/Alert'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { GameStatus, PLAYER_PAGE_COPY } from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'

import { PATHS } from '@config/routes'

// The page of a player who has joined a game. It connects with the player token. This first version only
// confirms the join; the lobby and the game screens replace it step by step.
export function PlayerGamePage() {
	const { hasToken, player, status, error } = usePlayerGame()

	// The token is gone, e.g. the player left the game: there is nothing to show here any more.
	if (!hasToken) return <Navigate to={PATHS.home} replace />

	return (
		<AuthLayout>
			{error ? <Alert variant='danger'>{error}</Alert> : null}
			{player ? (
				<>
					<Heading level={2}>
						{PLAYER_PAGE_COPY.joined(player.nickname)}
					</Heading>
					<Text tone='muted'>{player.quizTitle}</Text>
					<Text>{PLAYER_PAGE_COPY.gameCode(player.code)}</Text>
					{status === GameStatus.Lobby ? (
						<Alert variant='info'>{PLAYER_PAGE_COPY.waitingForHost}</Alert>
					) : null}
				</>
			) : (
				<Text tone='muted'>{PLAYER_PAGE_COPY.connecting}</Text>
			)}
		</AuthLayout>
	)
}
