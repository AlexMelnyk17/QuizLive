import { useEffect, useState } from 'react'

import { PREFERS_REDUCED_MOTION_QUERY } from '@modules/statistics/constants'

function readPrefersReducedMotion(): boolean {
	return window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches
}

export function usePrefersReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(
		readPrefersReducedMotion
	)

	useEffect(() => {
		const media = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY)
		const onChange = () => {
			setPrefersReducedMotion(media.matches)
		}

		media.addEventListener('change', onChange)

		return () => {
			media.removeEventListener('change', onChange)
		}
	}, [])

	return prefersReducedMotion
}
