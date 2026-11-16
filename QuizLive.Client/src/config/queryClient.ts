import type { DefaultOptions } from '@tanstack/react-query'

export const QUERY_CLIENT_DEFAULT_OPTIONS = {
	queries: {
		retry: 1,
		refetchOnWindowFocus: false,
		staleTime: 60_000,
	},
} satisfies DefaultOptions