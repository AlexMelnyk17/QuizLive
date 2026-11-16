import { Badge } from '@components/ui/Badge'
import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import {
	quizCard,
	quizCardDescription,
	quizCardHeader,
	quizCardMeta,
	quizCardTitle,
	quizCardTitleButton
} from '@modules/quizzes/components/QuizListItem.css'
import { QUIZ_KIND_LABELS, QUIZ_LIST_COPY } from '@modules/quizzes/constants'
import type { QuizDto } from '@modules/quizzes/types'
import { formatQuestionCount } from '@modules/quizzes/utils/formatQuestionCount'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'

export type QuizListItemProps = {
	quiz: QuizDto
	onOpen?: (quizId: number) => void
}

export function QuizListItem({ quiz, onOpen }: QuizListItemProps) {
	return (
		<Card variant='outlined' padding='md' fullWidth className={quizCard}>
			<div className={quizCardHeader}>
				<Heading level={3} className={quizCardTitle}>
					{onOpen ? (
						<button
							type='button'
							className={quizCardTitleButton}
							onClick={() => onOpen(quiz.id)}
						>
							{quiz.title}
						</button>
					) : (
						quiz.title
					)}
				</Heading>
				{quiz.isArchived ? (
					<Badge variant='warning'>{QUIZ_LIST_COPY.archivedBadge}</Badge>
				) : null}
			</div>

			{quiz.description ? (
				<Text size='sm' tone='muted' className={quizCardDescription}>
					{quiz.description}
				</Text>
			) : null}

			<div className={quizCardMeta}>
				<Badge variant='primary'>{QUIZ_KIND_LABELS[quiz.kind]}</Badge>
				<Text size='sm' tone='muted'>
					{formatQuestionCount(quiz.questionCount)} · Created{' '}
					{formatQuizDate(quiz.createdAtUtc)}
				</Text>
			</div>
		</Card>
	)
}
