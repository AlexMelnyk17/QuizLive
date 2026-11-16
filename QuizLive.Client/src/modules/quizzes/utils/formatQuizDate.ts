import { parseUtcDate } from '@modules/quizzes/utils/parseUtcDate'

export function formatQuizDate(value: string): string {
	return parseUtcDate(value).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
}