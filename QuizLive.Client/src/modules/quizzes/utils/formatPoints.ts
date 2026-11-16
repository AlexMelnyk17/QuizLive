import { QUIZ_FORMAT_COPY } from '@modules/quizzes/constants'

export function formatPoints(points: number): string {
	const label =
		points === 1 ? QUIZ_FORMAT_COPY.pointSingular : QUIZ_FORMAT_COPY.pointPlural
	return `${points} ${label}`
}