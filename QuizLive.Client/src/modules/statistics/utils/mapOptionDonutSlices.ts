import type { OptionDonutSlice } from '@modules/statistics/types'

export function mapOptionDonutSlices(
	options: Array<{ optionId: number; text: string; count: number }>,
): OptionDonutSlice[] {
	return options.map((option) => ({
		key: String(option.optionId),
		label: option.text,
		value: option.count,
	}))
}
