import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { HostStatValue } from '@modules/statistics/components/HostStatValue'
import {
	HOST_STAT_FORMAT,
	PREFERS_REDUCED_MOTION_QUERY
} from '@modules/statistics/constants'

import { renderWithTheme } from '@src/test/testUtils'

describe('HostStatValue', () => {
	afterEach(() => {
		cleanup()
		window.matchMedia = (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			addListener: () => undefined,
			removeListener: () => undefined,
			dispatchEvent: () => false
		})
	})

	it('counts an integer up to the formatted total', async () => {
		renderWithTheme(
			<HostStatValue value={10} format={HOST_STAT_FORMAT.integer} />
		)

		expect(await screen.findByText('10')).toBeInTheDocument()
	})

	it('shows a one-decimal average without counting', () => {
		renderWithTheme(
			<HostStatValue value={2.5} format={HOST_STAT_FORMAT.decimal} />
		)

		expect(screen.getByText(/^2[.,]5$/)).toBeInTheDocument()
	})

	it('fades in text values such as dates without counting', () => {
		renderWithTheme(
			<HostStatValue value='Nov 15, 2026' format={HOST_STAT_FORMAT.text} />
		)

		expect(screen.getByText('Nov 15, 2026')).toBeInTheDocument()
	})

	it('shows the final integer immediately when motion is reduced', () => {
		window.matchMedia = (query: string) => ({
			matches: query === PREFERS_REDUCED_MOTION_QUERY,
			media: query,
			onchange: null,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			addListener: () => undefined,
			removeListener: () => undefined,
			dispatchEvent: () => false
		})

		renderWithTheme(
			<HostStatValue value={10} format={HOST_STAT_FORMAT.integer} />
		)

		expect(screen.getByText('10')).toBeInTheDocument()
	})
})
