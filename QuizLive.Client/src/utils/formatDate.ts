/** Format an ISO calendar date (yyyy-MM-dd) for display in UTC. */
export function formatDate(isoDate: string): string {
	const parsed = new Date(`${isoDate}T00:00:00Z`)
	return parsed.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	})
}
