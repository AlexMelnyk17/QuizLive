import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { quizDetailsEmpty } from '@modules/quizzes/components/QuizDetails.css'
import { QUIZ_DETAILS_COPY } from '@modules/quizzes/constants'

export type QuizNotFoundProps = {
	onBack?: () => void
}

export function QuizNotFound({ onBack }: QuizNotFoundProps) {
	return (
		<div className={quizDetailsEmpty}>
			<Heading level={3}>{QUIZ_DETAILS_COPY.notFound.title}</Heading>
			<Text tone='muted'>{QUIZ_DETAILS_COPY.notFound.body}</Text>
			{onBack ? (
				<Button variant='primary' onClick={onBack}>
					{QUIZ_DETAILS_COPY.notFound.back}
				</Button>
			) : null}
		</div>
	)
}
