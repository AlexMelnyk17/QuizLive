import { STATISTICS_MOTION } from '@modules/statistics/constants'
import { usePrefersReducedMotion } from '@modules/statistics/hooks/usePrefersReducedMotion'

const STATS_CHART_ANIMATION = {
	isAnimationActive: true,
	animationDuration: STATISTICS_MOTION.chartDurationMs,
	animationEasing: 'ease-out' as const,
	isUpdateAnimationActive: false
}

export function useStatsChartAnimation() {
	const prefersReducedMotion = usePrefersReducedMotion()

	if (!prefersReducedMotion) {
		return STATS_CHART_ANIMATION
	}

	return { ...STATS_CHART_ANIMATION, isAnimationActive: false }
}
