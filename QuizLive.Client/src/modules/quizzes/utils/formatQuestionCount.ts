import { QUIZ_FORMAT_COPY } from '@modules/quizzes/constants'

export function formatQuestionCount(count: number): string {
	const label =
		count === 1 ? QUIZ_FORMAT_COPY.questionSingular : QUIZ_FORMAT_COPY.questionPlural
	return `${count} ${label}`
}