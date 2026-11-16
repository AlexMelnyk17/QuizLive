import type { RecipeVariants } from '@vanilla-extract/recipes'

import { progressFill, progressLabel, progressTrack } from '@components/ui/ProgressBar/ProgressBar.css'

type TrackVariants = NonNullable<RecipeVariants<typeof progressTrack>>
type FillVariants = NonNullable<RecipeVariants<typeof progressFill>>

export type ProgressBarProps = TrackVariants &
	FillVariants & {
		value: number
		max?: number
		showLabel?: boolean
		className?: string
	}

export function ProgressBar({
	className,
	value,
	max = 100,
	size,
	variant,
	striped,
	animated,
	showLabel = false,
}: ProgressBarProps) {
	const clamped = Math.min(Math.max(value, 0), max)
	const percent = max === 0 ? 0 : (clamped / max) * 100

	return (
		<div className={className}>
			<div
				className={progressTrack({ size })}
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={max}
				aria-valuenow={clamped}
			>
				<div
					className={progressFill({ variant, striped, animated })}
					style={{ width: `${percent}%` }}
				/>
			</div>
			{showLabel ? (
				<div className={progressLabel}>{Math.round(percent)}%</div>
			) : null}
		</div>
	)
}
