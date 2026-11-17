import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { AnswerOption } from '@components/ui/AnswerOption'
import { CountdownRing } from '@components/ui/CountdownRing'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { PlayerOpenAnswerForm } from '@modules/game/components/PlayerOpenAnswerForm'
import {
	countdown,
	optionsList,
	questionImage
} from '@modules/game/components/PlayerQuestionView.css'
import {
	PLAYER_ANSWER_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type {
	PlayerQuestionDto,
	SubmitAnswerRequest
} from '@modules/game/types'

export type PlayerQuestionViewProps = {
	question: PlayerQuestionDto
	// When the question arrived, on the device clock: the countdown is counted from it.
	receivedAtMs: number | null
	hasAnswered?: boolean
	selectedAnswer?: SubmitAnswerRequest | null
	isSubmitting?: boolean
	connected?: boolean
	onSubmitAnswer?: (answer: SubmitAnswerRequest) => Promise<string | null>
}

// The server confirms the answer before the view shows it as accepted.
// There is never a correct option here: the server does not send it to players.
export function PlayerQuestionView({
	question,
	receivedAtMs,
	hasAnswered = false,
	selectedAnswer = null,
	isSubmitting = false,
	connected = false,
	onSubmitAnswer
}: PlayerQuestionViewProps) {
	const secondsLeft = useQuestionCountdown(question.timing, receivedAtMs)
	const [answerError, setAnswerError] = useState<string | null>(null)
	const disabled =
		!connected || !onSubmitAnswer || isSubmitting || secondsLeft === 0
	async function answer(value: Pick<SubmitAnswerRequest, 'optionId' | 'text'>) {
		if (disabled || !onSubmitAnswer) return
		setAnswerError(null)
		setAnswerError(
			await onSubmitAnswer({ questionNumber: question.number, ...value })
		)
	}

	return (
		<>
			<Heading level={2}>
				{PLAYER_QUESTION_COPY.heading(question.number, question.total)}
			</Heading>

			{secondsLeft !== null && question.timeLimitSeconds !== null ? (
				<div className={countdown}>
					<CountdownRing
						value={secondsLeft}
						total={question.timeLimitSeconds}
					/>
				</div>
			) : null}
			{secondsLeft === 0 ? (
				<Text tone='muted' align='center'>
					{PLAYER_QUESTION_COPY.timeUp}
				</Text>
			) : null}

			<Text>{question.text}</Text>

			{question.imageUrl ? (
				<img
					className={questionImage}
					src={question.imageUrl}
					alt={PLAYER_QUESTION_COPY.imageAlt}
				/>
			) : null}

			{question.options ? (
				<Stack direction='column' role='list' className={optionsList}>
					{question.options.map((option, index) => (
						<div role='listitem' key={option.id}>
							<AnswerOption
								index={index}
								state={
									selectedAnswer?.optionId === option.id ? 'selected' : 'idle'
								}
								aria-pressed={selectedAnswer?.optionId === option.id}
								disabled={disabled}
								onClick={() => void answer({ optionId: option.id })}
							>
								{option.text}
							</AnswerOption>
						</div>
					))}
				</Stack>
			) : (
				<PlayerOpenAnswerForm
					key={selectedAnswer?.text ?? ''}
					initialText={selectedAnswer?.text ?? ''}
					hasAnswered={hasAnswered}
					disabled={disabled}
					isSubmitting={isSubmitting}
					onSubmit={text => answer({ text })}
				/>
			)}
			{hasAnswered ? (
				<Alert variant='success'>{PLAYER_ANSWER_COPY.accepted}</Alert>
			) : null}
			{answerError ? <Alert variant='danger'>{answerError}</Alert> : null}
		</>
	)
}
