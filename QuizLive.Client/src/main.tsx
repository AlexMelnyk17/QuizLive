import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from '@theme/ThemeProvider'
import '@theme/global.css'
import { initializeTheme } from '@theme/initializeTheme'

import { AppProviders } from '@providers/AppProviders'

import App from '@src/App'

initializeTheme()

const rootElement = document.getElementById('root')
if (!rootElement) {
	throw new Error('Root element not found')
}

createRoot(rootElement).render(
	<StrictMode>
		<ThemeProvider>
			<AppProviders>
				<App />
			</AppProviders>
		</ThemeProvider>
	</StrictMode>
)
