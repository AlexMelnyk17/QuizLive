import { apiRequest } from '@api/client'

import { hostStatsSchema } from '@modules/statistics/schemas'
import type { HostStats } from '@modules/statistics/types'

export async function fetchHostStats(): Promise<HostStats> {
	const data = await apiRequest<HostStats>('/stats')
	return hostStatsSchema.parse(data)
}