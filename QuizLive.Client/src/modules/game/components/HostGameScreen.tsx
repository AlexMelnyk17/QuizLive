import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { HOST_GAME_COPY } from '@modules/game/constants'
import { useHostGame } from '@modules/game/hooks/useHostGame'

export type HostGameScreenProps = {
	gameId: number
	onBack: () => void
}

// The game as the host sees it. It joins the game it is mounted with, so the page gives it `key={gameId}`.
export function HostGameScreen({ gameId, onBack }: HostGameScreenProps) {
	const { game, error } = useHostGame(gameId)

	// The host could not be connected (the game has ended, or is not the host's): the only way on is back.
	if (error) {
		return (
			<Stack direction='column' align='stretch'>
				<Alert variant='danger'>{error}</Alert>
				<div>
					<Button variant='secondary' onClick={onBack}>
						{HOST_GAME_COPY.backToQuizzes}
					</Button>
				</div>
			</Stack>
		)
	}

	if (!game) return <Text tone='muted'>{HOST_GAME_COPY.connecting}</Text>

	return <Heading level={2}>{game.quizTitle}</Heading>
}
