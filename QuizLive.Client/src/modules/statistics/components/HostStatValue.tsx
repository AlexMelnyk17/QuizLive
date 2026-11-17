import { hostStatDecimalFade } from '@modules/statistics/components/HostStatValue.css'
import { HOST_STAT_FORMAT } from '@modules/statistics/constants'
import { useCountUp } from '@modules/statistics/hooks/useCountUp'
import { usePrefersReducedMotion } from '@modules/statistics/hooks/usePrefersReducedMotion'
import { formatStatDecimal } from '@modules/statistics/utils/formatStatDecimal'
import { formatStatInteger } from '@modules/statistics/utils/formatStatInteger'

export type HostStatValueProps =
	| {
			format: typeof HOST_STAT_FORMAT.integer
			value: number
	  }
	| {
			format: typeof HOST_STAT_FORMAT.decimal
			value: number
	  }
	| {
			format: typeof HOST_STAT_FORMAT.text
			value: string
	  }

export function HostStatValue({ format, value }: HostStatValueProps) {
	const prefersReducedMotion = usePrefersReducedMotion()
	const shouldCount =
		format === HOST_STAT_FORMAT.integer && !prefersReducedMotion
	const displayed = useCountUp(
		typeof value === 'number' ? value : 0,
		shouldCount
	)

	if (typeof value === 'string') {
		return <span className={hostStatDecimalFade}>{value}</span>
	}

	if (format === HOST_STAT_FORMAT.decimal) {
		return (
			<span className={hostStatDecimalFade}>{formatStatDecimal(value)}</span>
		)
	}

	return <span>{formatStatInteger(displayed)}</span>
}
