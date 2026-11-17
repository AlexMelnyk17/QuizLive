// The server sends UTC dates without "Z" (SQLite does not keep the kind), and browsers read such dates as local time.
export function parseUtcDate(value: string): Date {
	const hasOffset = /(Z|[+-]\d{2}:\d{2})$/i.test(value)
	return new Date(hasOffset ? value : `${value}Z`)
}
