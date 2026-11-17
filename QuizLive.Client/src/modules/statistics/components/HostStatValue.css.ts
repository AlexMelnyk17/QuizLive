import { keyframes, style } from '@vanilla-extract/css'

import {
	PREFERS_REDUCED_MOTION_QUERY,
	STATISTICS_MOTION
} from '@modules/statistics/constants'

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 }
})

export const hostStatDecimalFade = style({
	animation: `${fadeIn} ${STATISTICS_MOTION.numberDurationMs}ms ease-out both`,
	'@media': {
		[PREFERS_REDUCED_MOTION_QUERY]: {
			animation: 'none'
		}
	}
})
