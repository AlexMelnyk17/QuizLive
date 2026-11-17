import { GAME_ERROR_COPY, HUB_EXCEPTION_MARKER } from '@modules/game/constants'

// Gives the text to show to the user for a failed hub call. A HubException carries a readable message from
// the server; its text follows a fixed marker. Any other failure (no connection, a broken response, the
// generic message SignalR gives for a rejected [Authorize]) has nothing readable, so the generic copy is
// shown. A hub error has no status code, which is why the text is searched for the marker.
export function getHubErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return GAME_ERROR_COPY.generic

	const markerAt = error.message.indexOf(HUB_EXCEPTION_MARKER)
	if (markerAt === -1) return GAME_ERROR_COPY.generic

	const text = error.message.slice(markerAt + HUB_EXCEPTION_MARKER.length)

	return text.trim() || GAME_ERROR_COPY.generic
}
