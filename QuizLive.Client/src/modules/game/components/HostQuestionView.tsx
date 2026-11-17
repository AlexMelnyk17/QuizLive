import { Alert } from '@components/ui/Alert'
import { AnswerOption } from '@components/ui/AnswerOption'
import { Badge } from '@components/ui/Badge'
import { Button } from '@components/ui/Button'
import { CountdownRing } from '@components/ui/CountdownRing'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import {
	countdown,
	optionsList,
	questionImage
} from '@modules/game/components/PlayerQuestionView.css'
import {
	HOST_QUESTION_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
import { useHostCommand } from '@modules/game/hooks/useHostCommand'
import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type { HostQuestionDto } from '@modules/game/types'

export type HostQuestionViewProps = {
	question: HostQuestionDto
	// When the question arrived, on the device clock: the countdown is counted from it.
	receivedAtMs: number | null
	// Gives the readable error text, or null when the server accepted the command.
	onShowResults: () => Promise<string | null>
}

// The running question as the host sees it: like the player's, but the correct option is marked, and the
// host closes the question with "Show results".
export function HostQuestionView({
	question,
	receivedAtMs,
	onShowResults
}: HostQuestionViewProps) {
	const { question: content } = question
	const secondsLeft = useQuestionCountdown(question.timing, receivedAtMs)
	const { run: showResults, error, isRunning } = useHostCommand(onShowResults)

	return (
		<>
			<Heading level={2}>
				{PLAYER_QUESTION_COPY.heading(question.number, question.total)}
			</Heading>

			{secondsLeft !== null && content.timeLimitSeconds !== null ? (
				<div className={countdown}>
					<CountdownRing value={secondsLeft} total={content.timeLimitSeconds} />
				</div>
			) : null}
			{secondsLeft === 0 ? (
				<Text tone='muted' align='center'>
					{PLAYER_QUESTION_COPY.timeUp}
				</Text>
			) : null}

			<Text>{content.text}</Text>

			{content.imageUrl ? (
				<img
					className={questionImage}
					src={content.imageUrl}
					alt={PLAYER_QUESTION_COPY.imageAlt}
				/>
			) : null}

			{content.options ? (
				<Stack direction='column' role='list' className={optionsList}>
					{content.options.map((option, index) => (
						<div role='listitem' key={option.id}>
							<AnswerOption
								index={index}
								state={option.isCorrect ? 'correct' : 'idle'}
								disabled
							>
								{option.text}
								{option.isCorrect ? (
									<>
										{' '}
										<Badge variant='success'>
											{HOST_QUESTION_COPY.correct}
										</Badge>
									</>
								) : null}
							</AnswerOption>
						</div>
					))}
				</Stack>
			) : (
				<Text size='sm' tone='muted'>
					{HOST_QUESTION_COPY.openText}
				</Text>
			)}

			{error ? <Alert variant='danger'>{error}</Alert> : null}

			<Button
				variant='primary'
				loading={isRunning}
				onClick={() => void showResults()}
			>
				{HOST_QUESTION_COPY.showResults}
			</Button>
		</>
	)
}
