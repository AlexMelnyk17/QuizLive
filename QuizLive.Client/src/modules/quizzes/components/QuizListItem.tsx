import { Badge } from '@components/ui/Badge'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import {
	quizCard,
	quizCardActions,
	quizCardDescription,
	quizCardHeader,
	quizCardMeta,
	quizCardTitle,
	quizCardTitleButton
} from '@modules/quizzes/components/QuizListItem.css'
import { QUIZ_KIND_LABELS, QUIZ_LIST_COPY } from '@modules/quizzes/constants'
import type { QuizDto } from '@modules/quizzes/types'
import { formatQuestionCount, formatQuizDate } from '@modules/quizzes/utils'

export type QuizListItemProps = {
	quiz: QuizDto
	isUpdating: boolean
	onToggleArchived: (quiz: QuizDto) => void
	onOpen?: (quizId: number) => void
}

export function QuizListItem({
	quiz,
	isUpdating,
	onToggleArchived,
	onOpen
}: QuizListItemProps) {
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

			<div className={quizCardActions}>
				<Button
					variant='outline'
					size='sm'
					loading={isUpdating}
					onClick={() => onToggleArchived(quiz)}
					aria-label={`${quiz.isArchived ? QUIZ_LIST_COPY.unarchive : QUIZ_LIST_COPY.archive} "${quiz.title}"`}
				>
					{quiz.isArchived ? QUIZ_LIST_COPY.unarchive : QUIZ_LIST_COPY.archive}
				</Button>
			</div>
		</Card>
	)
}
