import { QUIZ_FORMAT_COPY } from '@modules/quizzes/constants'

export function formatTimeLimit(seconds: number | null): string {
	if (seconds === null) {
		return QUIZ_FORMAT_COPY.noTimeLimit
	}
	return `${seconds} ${QUIZ_FORMAT_COPY.secondsSuffix}`
}
