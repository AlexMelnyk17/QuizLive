import { GameStatus } from '@modules/game/constants'
import type { GameProgress } from '@modules/game/types'

// A finished game is ahead of everything; then a later question; then a later status of the same question.
function rank({ status, questionNumber }: GameProgress): number[] {
	return [
		status === GameStatus.Finished ? 1 : 0,
		questionNumber ?? 0,
		status ?? -1
	]
}

// Whether a message describes an earlier moment of the game than the client already knows. The answer to
// ConnectAs* and the events can arrive in either order, so an old snapshot must not undo a newer event
// (for example bring back a question that was already closed). Equal progress is not stale: applying it
// again changes nothing.
export function isStaleSnapshot(
	current: GameProgress,
	incoming: GameProgress
): boolean {
	if (current.status === null) return false

	const known = rank(current)
	const arrived = rank(incoming)

	for (const [index, value] of arrived.entries()) {
		const knownValue = known[index] ?? 0

		if (value !== knownValue) return value < knownValue
	}

	return false
}
