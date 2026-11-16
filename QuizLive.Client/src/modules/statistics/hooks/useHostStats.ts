import { useQuery } from '@tanstack/react-query'

import { fetchHostStats } from '@modules/statistics/api/statsApi'
import { STATS_QUERY_KEY } from '@modules/statistics/constants'

export function useHostStats() {
	return useQuery({
		queryKey: STATS_QUERY_KEY,
		queryFn: fetchHostStats,
	})
}