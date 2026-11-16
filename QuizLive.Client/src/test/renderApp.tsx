import { RouterProvider } from '@tanstack/react-router'
import { act, render } from '@testing-library/react'

import { ThemeProvider } from '@theme/ThemeProvider'

import { AppProviders } from '@providers/AppProviders'

import { PATHS } from '@config/routes'

import { router } from '@src/router'

// The router is shared between tests, so it navigates after the app is mounted.
export async function renderApp(href: string = PATHS.home) {
	const result = render(
		<ThemeProvider>
			<AppProviders>
				<RouterProvider router={router} />
			</AppProviders>
		</ThemeProvider>
	)

	await act(() => router.navigate({ href }))

	return result
}
