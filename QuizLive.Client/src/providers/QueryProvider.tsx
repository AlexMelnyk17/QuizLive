import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { QUERY_CLIENT_DEFAULT_OPTIONS } from '@config/queryClient'

export type QueryProviderProps = {
	children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
	const [client] = useState(
		() => new QueryClient({ defaultOptions: QUERY_CLIENT_DEFAULT_OPTIONS })
	)

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
