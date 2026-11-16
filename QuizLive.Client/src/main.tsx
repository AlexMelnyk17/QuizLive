import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from '@theme/ThemeProvider'

import { AppProviders } from '@providers/AppProviders'

import App from '@src/App'
import '@theme/global.css'

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
