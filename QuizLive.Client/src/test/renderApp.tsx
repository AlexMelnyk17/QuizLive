import { RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { ThemeProvider } from '@theme/ThemeProvider'

import { AppProviders } from '@providers/AppProviders'

import { router } from '@src/router'

export async function renderApp() {
	await router.navigate({ to: '/' })
	return render(
		<ThemeProvider>
			<AppProviders>
				<RouterProvider router={router} />
			</AppProviders>
		</ThemeProvider>
	)
}
