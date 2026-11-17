import { useEffect, useRef, useState } from 'react'

export function useStatsChartShellSize() {
	const shellRef = useRef<HTMLDivElement>(null)
	const [hasSize, setHasSize] = useState(false)

	useEffect(() => {
		const shell = shellRef.current

		if (!shell) {
			return
		}

		const markReady = (width: number, height: number) => {
			if (width > 0 && height > 0) {
				setHasSize(true)
			}
		}

		markReady(shell.clientWidth, shell.clientHeight)

		const observer = new ResizeObserver(entries => {
			const entry = entries[0]

			if (!entry) {
				return
			}

			markReady(entry.contentRect.width, entry.contentRect.height)
		})

		observer.observe(shell)

		return () => {
			observer.disconnect()
		}
	}, [])

	return { shellRef, hasSize }
}
