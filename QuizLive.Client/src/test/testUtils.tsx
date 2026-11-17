import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { ThemeProvider } from '@theme/ThemeProvider'

export const LAZY_UI_TIMEOUT_MS = 5000

export function renderWithTheme(ui: ReactElement) {
	return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// For a component that loads data with TanStack Query. Every call gets a fresh cache, and a failed query is
// retried at once, so a test does not wait for the pause between retries.
export function renderWithQuery(ui: ReactElement) {
	const client = new QueryClient({
		defaultOptions: { queries: { retryDelay: 0 } }
	})

	return render(
		<ThemeProvider>
			<QueryClientProvider client={client}>{ui}</QueryClientProvider>
		</ThemeProvider>
	)
}
