import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { QUIZ_KIND_LABELS } from '@modules/dashboard/constants'
import type { QuizDto } from '@modules/dashboard/types'

export type QuizListItemProps = {
	quiz: QuizDto
}

function formatCreatedAt(createdAtUtc: string) {
	return new Date(createdAtUtc).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

export function QuizListItem({ quiz }: QuizListItemProps) {
	const kindLabel = QUIZ_KIND_LABELS[quiz.kind] ?? 'Quiz'

	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Heading level={3}>{quiz.title}</Heading>
				{quiz.description ? (
					<Text size="sm" tone="muted">{quiz.description}</Text>
				) : null}
				<Text size="sm" tone="muted">
					{kindLabel} · {quiz.questionCount}{' '}
					{quiz.questionCount === 1 ? 'question' : 'questions'} · Created{' '}
					{formatCreatedAt(quiz.createdAtUtc)}
				</Text>
			</Stack>
		</Card>
	)
}
