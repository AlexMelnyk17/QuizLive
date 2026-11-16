import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import {
	questionsSection,
	sectionHeader
} from '@modules/quizzes/components/QuizEditor.css'
import {
	QUESTION_FORM_COPY,
	QUIZ_DETAILS_COPY
} from '@modules/quizzes/constants'

export function QuestionNotFound({
	onRefresh,
	onBack
}: {
	onRefresh: () => void
	onBack: () => void
}) {
	return (
		<Stack className={questionsSection}>
			<Heading level={2}>{QUESTION_FORM_COPY.notFoundTitle}</Heading>
			<Text tone='muted'>{QUESTION_FORM_COPY.notFoundBody}</Text>
			<div className={sectionHeader}>
				<Button onClick={onRefresh}>{QUESTION_FORM_COPY.refresh}</Button>
				<Button variant='outline' onClick={onBack}>
					{QUIZ_DETAILS_COPY.notFound.back}
				</Button>
			</div>
		</Stack>
	)
}
