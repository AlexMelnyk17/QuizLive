import { keyframes, style } from '@vanilla-extract/css'

import { statsKpiGrid } from '@modules/statistics/components/StatisticsPage.css'
import {
	PREFERS_REDUCED_MOTION_QUERY,
	STATISTICS_MOTION
} from '@modules/statistics/constants'

const kpiEnter = keyframes({
	from: {
		opacity: 0,
		transform: 'translateY(0.4rem)'
	},
	to: {
		opacity: 1,
		transform: 'translateY(0)'
	}
})

const kpiStaggerSelectors = Object.fromEntries(
	[2, 3, 4, 5].map(index => [
		`${statsKpiGrid} > &:nth-child(${index})`,
		{ animationDelay: `${STATISTICS_MOTION.cardStaggerMs * (index - 1)}ms` }
	])
)

export const statsKpiEnter = style({
	animation: `${kpiEnter} ${STATISTICS_MOTION.cardDurationMs}ms ease-out both`,
	selectors: kpiStaggerSelectors,
	'@media': {
		[PREFERS_REDUCED_MOTION_QUERY]: {
			animation: 'none'
		}
	}
})
