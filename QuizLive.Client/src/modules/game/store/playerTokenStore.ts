import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { PLAYER_TOKEN_STORAGE_KEY } from '@modules/game/constants'
import { playerTokenStorageSchema } from '@modules/game/schemas'

type PlayerTokenState = {
	playerToken: string | null
	setPlayerToken: (playerToken: string) => void
	clearPlayerToken: () => void
}

// The server returns the player token once, on join, so it has to be kept to connect to the game again
// (after a reload or a reconnect). sessionStorage is per tab, and a new join replaces the old token.
export const usePlayerTokenStore = create<PlayerTokenState>()(
	persist(
		set => ({
			playerToken: null,
			setPlayerToken: playerToken => set({ playerToken }),
			clearPlayerToken: () => set({ playerToken: null })
		}),
		{
			name: PLAYER_TOKEN_STORAGE_KEY,
			storage: createJSONStorage(() => sessionStorage),
			partialize: state => ({ playerToken: state.playerToken }),
			// Damaged data in storage is ignored: the player just has no token, instead of a broken game.
			merge: (persisted, current) => {
				const parsed = playerTokenStorageSchema.safeParse(persisted)

				return parsed.success ? { ...current, ...parsed.data } : current
			}
		}
	)
)

export function usePlayerToken(): string | null {
	return usePlayerTokenStore(state => state.playerToken)
}
