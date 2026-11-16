import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'

export type QueryProviderProps = {
	children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			})
	)

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
