import { useNavigate } from '@tanstack/react-router'

import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { buttonRow } from '@modules/game/components/HostGame.css'
import { HOST_FINISHED_COPY } from '@modules/game/constants'

import { PATHS } from '@config/routes'

export type HostFinishedViewProps = {
	quizId: number
	gameId: number
	onBack: () => void
}

// What the host sees when the game is over: where to read how it went, and the way back to the quizzes.
export function HostFinishedView({
	quizId,
	gameId,
	onBack
}: HostFinishedViewProps) {
	const navigate = useNavigate()

	return (
		<>
			<Heading level={2}>{HOST_FINISHED_COPY.title}</Heading>
			<Text tone='muted'>{HOST_FINISHED_COPY.body}</Text>

			<div className={buttonRow}>
				<Button
					variant='primary'
					onClick={() =>
						void navigate({
							to: PATHS.gameStats,
							params: { quizId: String(quizId), gameId: String(gameId) }
						})
					}
				>
					{HOST_FINISHED_COPY.viewStats}
				</Button>
				<Button variant='outline' onClick={onBack}>
					{HOST_FINISHED_COPY.back}
				</Button>
			</div>
		</>
	)
}
