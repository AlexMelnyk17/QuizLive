import { AnswerOption } from '@components/ui/AnswerOption'
import { CountdownRing } from '@components/ui/CountdownRing'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import {
	countdown,
	optionsList,
	questionImage
} from '@modules/game/components/PlayerQuestionView.css'
import { PLAYER_QUESTION_COPY } from '@modules/game/constants'
import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type { PlayerQuestionDto } from '@modules/game/types'

export type PlayerQuestionViewProps = {
	question: PlayerQuestionDto
	// When the question arrived, on the device clock: the countdown is counted from it.
	receivedAtMs: number | null
}

// The running question as a player sees it. It cannot be answered yet, so the options are only shown.
// There is never a correct option here: the server does not send it to players.
export function PlayerQuestionView({
	question,
	receivedAtMs
}: PlayerQuestionViewProps) {
	const secondsLeft = useQuestionCountdown(question.timing, receivedAtMs)

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
							<AnswerOption index={index} disabled>
								{option.text}
							</AnswerOption>
						</div>
					))}
				</Stack>
			) : null}
		</>
	)
}
