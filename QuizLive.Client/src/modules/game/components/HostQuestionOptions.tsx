import { AnswerOption } from '@components/ui/AnswerOption'
import { Badge } from '@components/ui/Badge'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { optionsList } from '@modules/game/components/PlayerQuestionView.css'
import { HOST_QUESTION_COPY } from '@modules/game/constants'
import type { HostQuestionDto } from '@modules/game/types'

export type HostQuestionOptionsProps = {
	// Null for an open text question, which has no options.
	options: HostQuestionDto['question']['options']
}

// The options of a question as the host sees them, with the correct one marked. They cannot be chosen:
// the host does not play.
export function HostQuestionOptions({ options }: HostQuestionOptionsProps) {
	if (!options) {
		return (
			<Text size='sm' tone='muted'>
				{HOST_QUESTION_COPY.openText}
			</Text>
		)
	}

	return (
		<Stack direction='column' role='list' className={optionsList}>
			{options.map((option, index) => (
				<div role='listitem' key={option.id}>
					<AnswerOption
						index={index}
						state={option.isCorrect ? 'correct' : 'idle'}
						disabled
					>
						{option.text}
						{option.isCorrect ? (
							<>
								{' '}
								<Badge variant='success'>{HOST_QUESTION_COPY.correct}</Badge>
							</>
						) : null}
					</AnswerOption>
				</div>
			))}
		</Stack>
	)
}
