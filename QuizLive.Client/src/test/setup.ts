import '@testing-library/jest-dom/vitest'

const TEST_CHART_WIDTH = 800
const TEST_CHART_HEIGHT = 280

class ResizeObserverMock implements ResizeObserver {
	private readonly callback: ResizeObserverCallback

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback
	}

	observe(target: Element) {
		this.callback(
			[
				{
					target,
					contentRect: {
						x: 0,
						y: 0,
						width: TEST_CHART_WIDTH,
						height: TEST_CHART_HEIGHT,
						top: 0,
						left: 0,
						bottom: TEST_CHART_HEIGHT,
						right: TEST_CHART_WIDTH,
						toJSON: () => ({})
					},
					borderBoxSize: [],
					contentBoxSize: [],
					devicePixelContentBoxSize: []
				}
			],
			this
		)
	}

	unobserve() {
		return undefined
	}

	disconnect() {
		return undefined
	}
}

Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: ResizeObserverMock
})

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
		addListener: () => undefined,
		removeListener: () => undefined,
		dispatchEvent: () => false
	})
})
