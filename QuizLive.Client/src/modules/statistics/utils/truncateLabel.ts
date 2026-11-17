export function truncateLabel(text: string, maxLength: number): string {
	const trimmed = text.trim()
	if (trimmed.length <= maxLength) {
		return trimmed
	}

	return `${trimmed.slice(0, Math.max(1, maxLength - 1))}…`
}
