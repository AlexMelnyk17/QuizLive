import { Navigate } from '@tanstack/react-router'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { PlayerLobby } from '@modules/game/components/PlayerLobby'
import { PlayerQuestionView } from '@modules/game/components/PlayerQuestionView'
import {
	GameStatus,
	PLAYER_PAGE_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'

import { PATHS } from '@config/routes'

// The page of a player who has joined a game. It connects with the player token and shows the game as it
// goes: the lobby, the question, the wait for the next one, and the end. Leaving forgets the token, and
// the page then sends the player home.
export function PlayerGamePage() {
	const {
		hasToken,
		player,
		status,
		players,
		currentQuestion,
		questionReceivedAtMs,
		connectionState,
		error,
		leave
	} = usePlayerGame()

	// The token is gone, e.g. the player left the game: there is nothing to show here any more.
	if (!hasToken) return <Navigate to={PATHS.home} replace />

	return (
		<AuthLayout>
			{error ? <Alert variant='danger'>{error}</Alert> : null}

			{!player && !error ? (
				<Text tone='muted'>{PLAYER_PAGE_COPY.connecting}</Text>
			) : null}

			{/* The player could not be connected (e.g. the game has ended): the only way on is back. */}
			{!player && error ? (
				<Button variant='secondary' onClick={leave}>
					{PLAYER_PAGE_COPY.backToStart}
				</Button>
			) : null}

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

			{player && status === GameStatus.Question && currentQuestion ? (
				<PlayerQuestionView
					question={currentQuestion}
					receivedAtMs={questionReceivedAtMs}
				/>
			) : null}

			{player && status === GameStatus.Results ? (
				<>
					<Heading level={2}>
						{PLAYER_PAGE_COPY.joined(player.nickname)}
					</Heading>
					<Alert variant='info'>{PLAYER_QUESTION_COPY.closed}</Alert>
				</>
			) : null}

			{player && status === GameStatus.Finished ? (
				<>
					<Heading level={2}>{PLAYER_PAGE_COPY.finished}</Heading>
					<Text tone='muted'>{PLAYER_PAGE_COPY.finishedBody}</Text>
					<Button variant='primary' onClick={leave}>
						{PLAYER_PAGE_COPY.backToStart}
					</Button>
				</>
			) : null}
		</AuthLayout>
	)
}
