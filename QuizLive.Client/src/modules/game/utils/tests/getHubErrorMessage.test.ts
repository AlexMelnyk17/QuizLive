import { describe, expect, it } from 'vitest'

import { GAME_ERROR_COPY } from '@modules/game/constants'
import { getHubErrorMessage } from '@modules/game/utils/getHubErrorMessage'

describe('getHubErrorMessage', () => {
	it('gives the readable text the server put into a HubException', () => {
		const error = new Error(
			"An unexpected error occurred invoking 'ConnectAsPlayer' on the server. HubException: Player was not found."
		)

		expect(getHubErrorMessage(error)).toBe('Player was not found.')
	})

	it('keeps a text that itself contains a colon', () => {
		const error = new Error(
			"An unexpected error occurred invoking 'StartGame' on the server. HubException: Cannot start: no players."
		)

		expect(getHubErrorMessage(error)).toBe('Cannot start: no players.')
	})

	it('gives the generic text when the HubException has no text', () => {
		const error = new Error(
			"An unexpected error occurred invoking 'X' on the server. HubException:   "
		)

		expect(getHubErrorMessage(error)).toBe(GAME_ERROR_COPY.generic)
	})

	it.each([
		[
			'a rejected [Authorize]',
			new Error("Failed to invoke 'ConnectAsHost' because user is unauthorized")
		],
		[
			'a lost connection',
			new Error(
				'Cannot send data if the connection is not in the Connected state.'
			)
		],
		['something that is not an Error', 'boom'],
		['nothing', undefined]
	])('gives the generic text for %s', (_name, error) => {
		expect(getHubErrorMessage(error)).toBe(GAME_ERROR_COPY.generic)
	})
})
