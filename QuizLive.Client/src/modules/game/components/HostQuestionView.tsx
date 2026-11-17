import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { CountdownRing } from '@components/ui/CountdownRing'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { HostAddTimeButton } from '@modules/game/components/HostAddTimeButton'
import { HostQuestionOptions } from '@modules/game/components/HostQuestionOptions'
import {
	countdown,
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
	onAddTime?: (seconds: number) => Promise<string | null>
	connected?: boolean
}

// The running question as the host sees it: like the player's, but the correct option is marked, and the
// host closes the question with "Show results".
export function HostQuestionView({
	question,
	receivedAtMs,
	onShowResults,
	onAddTime,
	connected = true
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

			<HostQuestionOptions options={content.options} />

			{error ? <Alert variant='danger'>{error}</Alert> : null}
			{onAddTime && question.timing.endsAtUtc !== null ? (
				<HostAddTimeButton
					disabled={
						!connected || isRunning || secondsLeft === 0 || secondsLeft === null
					}
					onAddTime={onAddTime}
				/>
			) : null}

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
