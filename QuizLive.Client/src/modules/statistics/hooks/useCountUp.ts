import { useEffect, useRef, useState } from 'react'

import { STATISTICS_MOTION } from '@modules/statistics/constants'

function easeOutProgress(t: number): number {
	const remaining = 1 - t
	return 1 - remaining * remaining
}

export function useCountUp(target: number, enabled: boolean): number {
	const hasPlayedRef = useRef(false)
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		if (!enabled || hasPlayedRef.current || target === 0) {
			hasPlayedRef.current = true
			return
		}

		let frameId = 0
		const startedAt = performance.now()

		const tick = () => {
			const elapsed = Math.max(0, performance.now() - startedAt)
			const t = Math.min(elapsed / STATISTICS_MOTION.numberDurationMs, 1)
			setProgress(t)

			if (t === 1) {
				hasPlayedRef.current = true
				return
			}

			frameId = requestAnimationFrame(tick)
		}

		frameId = requestAnimationFrame(tick)

		return () => {
			cancelAnimationFrame(frameId)
		}
	}, [enabled, target])

	if (!enabled || target === 0 || progress === 1) {
		return target
	}

	return Math.round(target * easeOutProgress(progress))
}
