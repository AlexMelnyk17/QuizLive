import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
	observe() {
		return undefined
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
	value: ResizeObserverMock,
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
		dispatchEvent: () => false,
	}),
})
