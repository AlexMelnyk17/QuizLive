import type { ReactNode } from 'react'

import { configureApiClient } from '@api/client'
import { getAccessToken, handleUnauthorized } from '@modules/auth'
import { QueryProvider } from '@providers/QueryProvider'

configureApiClient({
	getAccessToken,
	onUnauthorized: handleUnauthorized,
})

export type AppProvidersProps = {
	children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
	return <QueryProvider>{children}</QueryProvider>
}
