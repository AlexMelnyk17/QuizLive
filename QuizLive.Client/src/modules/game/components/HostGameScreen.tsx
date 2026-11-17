import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Text } from '@components/ui/Text'

import { HostEndGameButton } from '@modules/game/components/HostEndGameButton'
import { HostFinishedView } from '@modules/game/components/HostFinishedView'
import { buttonRow, hostScreen } from '@modules/game/components/HostGame.css'
import { HostLobby } from '@modules/game/components/HostLobby'
import { HostQuestionView } from '@modules/game/components/HostQuestionView'
import { HostResultsView } from '@modules/game/components/HostResultsView'
import { GameStatus, HOST_GAME_COPY } from '@modules/game/constants'
import { useHostGame } from '@modules/game/hooks/useHostGame'

export type HostGameScreenProps = {
	gameId: number
	onBack: () => void
}

// The game as the host sees it. It joins the game it is mounted with, so the page gives it `key={gameId}`.
export function HostGameScreen({ gameId, onBack }: HostGameScreenProps) {
	const {
		game,
		status,
		players,
		currentQuestion,
		questionReceivedAtMs,
		connectionState,
		error,
		commands
	} = useHostGame(gameId)

	// The host could not be connected (the game has ended, or is not the host's): the only way on is back.
	if (error) {
		return (
			<div className={hostScreen}>
				<Alert variant='danger'>{error}</Alert>
				<div className={buttonRow}>
					<Button variant='secondary' onClick={onBack}>
						{HOST_GAME_COPY.backToQuizzes}
					</Button>
				</div>
			</div>
		)
	}

	if (!game) return <Text tone='muted'>{HOST_GAME_COPY.connecting}</Text>

	if (status === GameStatus.Finished) {
		return (
			<div className={hostScreen}>
				<HostFinishedView
					quizId={game.quizId}
					gameId={game.id}
					onBack={onBack}
				/>
			</div>
		)
	}

	return (
		<div className={hostScreen}>
			{status === GameStatus.Lobby ? (
				<HostLobby
					quizTitle={game.quizTitle}
					code={game.code}
					players={players}
					connectionState={connectionState}
					onStart={commands.startGame}
				/>
			) : null}

			{status === GameStatus.Question && currentQuestion ? (
				<HostQuestionView
					question={currentQuestion}
					receivedAtMs={questionReceivedAtMs}
					onShowResults={commands.showResults}
				/>
			) : null}

			{status === GameStatus.Results && currentQuestion ? (
				<HostResultsView
					question={currentQuestion}
					onNextQuestion={commands.nextQuestion}
				/>
			) : null}

			<HostEndGameButton onEndGame={commands.endGame} />
		</div>
	)
}
