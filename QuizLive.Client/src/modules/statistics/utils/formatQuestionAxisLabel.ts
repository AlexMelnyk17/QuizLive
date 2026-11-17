import {
	STATISTICS_QUESTION_AXIS_EMPTY_LABEL,
	STATISTICS_QUESTION_AXIS_LABEL_MAX
} from '@modules/statistics/constants'
import { truncateLabel } from '@modules/statistics/utils/truncateLabel'

export function formatQuestionAxisLabel(
	text: string,
	maxLength = STATISTICS_QUESTION_AXIS_LABEL_MAX
): string {
	const trimmed = text.trim()
	if (!trimmed) {
		return STATISTICS_QUESTION_AXIS_EMPTY_LABEL
	}

	return truncateLabel(trimmed, maxLength)
}
