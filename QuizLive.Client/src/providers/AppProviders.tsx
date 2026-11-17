import type { ReactNode } from 'react'

import { QueryProvider } from '@providers/QueryProvider'

import {
	getAccessToken,
	handleUnauthorized
} from '@modules/auth/store/sessionStore'

import { configureApiClient } from '@api/client'

configureApiClient({
	getAccessToken,
	onUnauthorized: handleUnauthorized
})

export type AppProvidersProps = {
	children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
	return <QueryProvider>{children}</QueryProvider>
}
