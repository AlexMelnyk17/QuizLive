import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { openTextEntriesList } from '@modules/statistics/components/GameOpenTextEntries.css'
import { GAME_STATS_PAGE_COPY } from '@modules/statistics/constants'
import type { OpenQuestionStats } from '@modules/statistics/types'

export type GameOpenTextEntriesProps = {
	questions: OpenQuestionStats[]
}

export function GameOpenTextEntries({ questions }: GameOpenTextEntriesProps) {
	return (
		<>
			{questions.map((question) => {
				const entries = question.entries ?? []
				if (entries.length === 0) {
					return null
				}

				return (
					<section key={question.questionId}>
						<Heading level={4}>{question.text}</Heading>
						<ul className={openTextEntriesList}>
							{entries.map((entry) => (
								<li key={`${entry.playerId}-${entry.answeredAtUtc}`}>
									<Text size="sm">
										{entry.nickname}: {entry.text}
										{entry.isHidden
											? ` ${GAME_STATS_PAGE_COPY.hiddenAnswerLabel}`
											: ''}
									</Text>
								</li>
							))}
						</ul>
					</section>
				)
			})}
		</>
	)
}
