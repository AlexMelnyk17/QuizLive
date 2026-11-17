import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { HostQuestionOptions } from '@modules/game/components/HostQuestionOptions'
import { HOST_RESULTS_COPY } from '@modules/game/constants'
import { useHostCommand } from '@modules/game/hooks/useHostCommand'
import type { HostQuestionDto } from '@modules/game/types'

export type HostResultsViewProps = {
	// The question that was closed, with its correct option.
	question: HostQuestionDto
	// Gives the readable error text, or null when the server accepted the command.
	onNextQuestion: () => Promise<string | null>
}

// What the host sees after a question is closed: the question with its correct answer, and the button
// that moves on. After the last question the same command finishes the game, so the button says so.
export function HostResultsView({
	question,
	onNextQuestion
}: HostResultsViewProps) {
	const { run: next, error, isRunning } = useHostCommand(onNextQuestion)
	const isLast = question.number === question.total

	return (
		<>
			<Heading level={2}>
				{HOST_RESULTS_COPY.heading(question.number, question.total)}
			</Heading>

			<Text>{question.question.text}</Text>
			<HostQuestionOptions options={question.question.options} />

			{error ? <Alert variant='danger'>{error}</Alert> : null}

			<Button variant='primary' loading={isRunning} onClick={() => void next()}>
				{isLast ? HOST_RESULTS_COPY.finish : HOST_RESULTS_COPY.next}
			</Button>
		</>
	)
}
