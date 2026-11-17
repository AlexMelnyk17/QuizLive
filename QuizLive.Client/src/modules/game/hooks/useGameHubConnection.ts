import type { HubConnection } from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'

import { createGameHubConnection } from '@modules/game/api/createGameHubConnection'
import { subscribeToGameEvents } from '@modules/game/api/subscribeToGameEvents'
import { GAME_CONNECTION_STATE } from '@modules/game/constants'
import type {
	GameConnectionStateValue,
	GameHubConnectionOptions,
	GameHubConnectionResult
} from '@modules/game/types'
import { getHubErrorMessage } from '@modules/game/utils/getHubErrorMessage'

// Owns the connection to the game hub for as long as the component is mounted: it starts the connection,
// joins the game, joins it again after every automatic reconnect (group membership belongs to a connection
// and is lost when the connection id changes), and stops the connection on unmount. The host and the player
// hooks build on it; they only say how to join and what to do with the events.
export function useGameHubConnection(
	options: GameHubConnectionOptions
): GameHubConnectionResult {
	const [connection, setConnection] = useState<HubConnection | null>(null)
	const [connectionState, setConnectionState] =
		useState<GameConnectionStateValue>(GAME_CONNECTION_STATE.disconnected)
	const [error, setError] = useState<string | null>(null)

	// The latest options: a new handler on every render must not restart the connection.
	const latest = useRef(options)
	useEffect(() => {
		latest.current = options
	})

	const { enabled } = options

	useEffect(() => {
		if (!enabled) return

		// Set when the effect is cleaned up (unmount, or Strict Mode's extra mount in development):
		// whatever finishes after that must not touch the state.
		let cancelled = false
		const hub = createGameHubConnection(latest.current.accessTokenFactory)

		// Subscribed before the connection starts, so no event can arrive before its handler exists.
		const unsubscribe = subscribeToGameEvents(hub, {
			onTimeAdded: payload => latest.current.handlers.onTimeAdded?.(payload),
			onPlayerJoined: player =>
				latest.current.handlers.onPlayerJoined?.(player),
			onQuestionShown: question =>
				latest.current.handlers.onQuestionShown?.(question),
			onHostQuestionShown: question =>
				latest.current.handlers.onHostQuestionShown?.(question),
			onQuestionClosed: number =>
				latest.current.handlers.onQuestionClosed?.(number),
			onGameEnded: () => latest.current.handlers.onGameEnded?.()
		})

		async function join() {
			try {
				await latest.current.join(hub)
			} catch (joinError) {
				if (cancelled) return
				setError(getHubErrorMessage(joinError))
				setConnectionState(GAME_CONNECTION_STATE.failed)
				return
			}

			if (cancelled) return
			setError(null)
			setConnectionState(GAME_CONNECTION_STATE.connected)
		}

		async function start() {
			setConnectionState(GAME_CONNECTION_STATE.connecting)

			try {
				await hub.start()
			} catch (startError) {
				if (cancelled) return
				setError(getHubErrorMessage(startError))
				setConnectionState(GAME_CONNECTION_STATE.failed)
				return
			}

			if (cancelled) return
			setConnection(hub)
			await join()
		}

		hub.onreconnecting(() => {
			if (!cancelled) setConnectionState(GAME_CONNECTION_STATE.reconnecting)
		})
		hub.onreconnected(() => {
			if (!cancelled) void join()
		})
		hub.onclose(() => {
			if (!cancelled) setConnectionState(GAME_CONNECTION_STATE.disconnected)
		})

		void start()

		return () => {
			cancelled = true
			unsubscribe()
			void hub.stop()
			setConnection(null)
			setConnectionState(GAME_CONNECTION_STATE.disconnected)
		}
	}, [enabled])

	return { connection, connectionState, error }
}
