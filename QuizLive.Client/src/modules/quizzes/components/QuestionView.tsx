import cn from 'clsx'
import type { ReactNode } from 'react'

import { Badge } from '@components/ui/Badge'
import { Card } from '@components/ui/Card'
import { Text } from '@components/ui/Text'

import {
	optionItem,
	optionItemCorrect,
	optionList,
	questionCard,
	questionImage,
	quizDetailsMeta,
	quizDetailsText
} from '@modules/quizzes/components/QuizDetails.css'
import { sectionHeader } from '@modules/quizzes/components/QuizEditor.css'
import { QUIZ_DETAILS_COPY, QuizKind } from '@modules/quizzes/constants'
import type { QuestionDto, QuizKindValue } from '@modules/quizzes/types'
import { formatPoints } from '@modules/quizzes/utils/formatPoints'
import { formatTimeLimit } from '@modules/quizzes/utils/formatTimeLimit'

export type QuestionViewProps = {
	question: QuestionDto
	kind: QuizKindValue
	actions?: ReactNode
}

export function QuestionView({ question, kind, actions }: QuestionViewProps) {
	const details = [
		formatTimeLimit(question.timeLimitSeconds),
		question.basePoints === null ? null : formatPoints(question.basePoints)
	].filter(Boolean)

	return (
		<Card variant='outlined' padding='md' fullWidth className={questionCard}>
			<div className={sectionHeader}>
				<div className={quizDetailsMeta}>
					<Text size='sm' weight='semibold' tone='muted'>
						{QUIZ_DETAILS_COPY.questionLabel(question.order)}
					</Text>
					<Text size='sm' tone='muted'>
						{details.join(' · ')}
					</Text>
				</div>
				{actions}
			</div>

			<Text weight='medium' className={quizDetailsText}>
				{question.text}
			</Text>

			{question.imageUrl ? (
				<img
					src={question.imageUrl}
					alt={QUIZ_DETAILS_COPY.imageAlt(question.order)}
					loading='lazy'
					className={questionImage}
				/>
			) : null}

			{kind === QuizKind.OpenText ? (
				<Text size='sm' tone='muted'>
					{QUIZ_DETAILS_COPY.openTextHint}
				</Text>
			) : (
				<ul className={optionList}>
					{(question.options ?? []).map(option => (
						<li
							key={option.id}
							className={cn(optionItem, option.isCorrect && optionItemCorrect)}
						>
							<Text size='sm'>{option.text}</Text>
							{option.isCorrect ? (
								<Badge variant='success'>
									{QUIZ_DETAILS_COPY.correctOption}
								</Badge>
							) : null}
						</li>
					))}
				</ul>
			)}
		</Card>
	)
}
