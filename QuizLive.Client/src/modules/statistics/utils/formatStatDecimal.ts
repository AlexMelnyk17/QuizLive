import { STAT_FORMAT_FRACTION_DIGITS } from '@modules/statistics/constants'

export function formatStatDecimal(value: number): string {
	return value.toLocaleString(undefined, {
		minimumFractionDigits: STAT_FORMAT_FRACTION_DIGITS,
		maximumFractionDigits: STAT_FORMAT_FRACTION_DIGITS
	})
}
