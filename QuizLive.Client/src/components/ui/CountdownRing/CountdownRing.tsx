import type { RecipeVariants } from '@vanilla-extract/recipes'

import { vars } from '@theme/contract.css'
import cn from 'clsx'

import { countdownLabel, countdownRoot, countdownSvg } from '@components/ui/CountdownRing/CountdownRing.css'

type CountdownVariants = NonNullable<RecipeVariants<typeof countdownRoot>>

const sizeMap = {
	sm: 56,
	md: 80,
	lg: 112,
} as const

export type CountdownRingProps = CountdownVariants & {
	value: number
	total: number
	className?: string
}

export function CountdownRing({
	className,
	size = 'md',
	value,
	total,
}: CountdownRingProps) {
	const dimension = sizeMap[size ?? 'md']
	const stroke = size === 'lg' ? 8 : size === 'sm' ? 5 : 6
	const radius = (dimension - stroke) / 2
	const circumference = 2 * Math.PI * radius
	const safeTotal = total <= 0 ? 1 : total
	const progress = Math.min(Math.max(value, 0), safeTotal) / safeTotal
	const offset = circumference * (1 - progress)

	return (
		<div className={cn(countdownRoot({ size }), className)}>
			<svg
				className={countdownSvg}
				width={dimension}
				height={dimension}
				viewBox={`0 0 ${dimension} ${dimension}`}
				aria-hidden
			>
				<circle
					cx={dimension / 2}
					cy={dimension / 2}
					r={radius}
					fill="none"
					stroke={vars.colors.border}
					strokeWidth={stroke}
				/>
				<circle
					cx={dimension / 2}
					cy={dimension / 2}
					r={radius}
					fill="none"
					stroke={vars.colors.primary}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
				/>
			</svg>
			<span className={countdownLabel({ size })}>{Math.ceil(value)}</span>
		</div>
	)
}
