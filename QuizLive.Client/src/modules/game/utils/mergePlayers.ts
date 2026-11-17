import type { GamePlayerDto } from '@modules/game/types'

// Adds the incoming players to the current ones without duplicates. After a connect, the same player can
// arrive twice: in the snapshot and as a PlayerJoined event. The first position of a player is kept, so the
// list does not jump; the data of a player that is already there is replaced by the newer one.
export function mergePlayers(
	current: GamePlayerDto[],
	incoming: GamePlayerDto[]
): GamePlayerDto[] {
	const byId = new Map(current.map(player => [player.id, player]))

	for (const player of incoming) {
		byId.set(player.id, player)
	}

	return [...byId.values()]
}
