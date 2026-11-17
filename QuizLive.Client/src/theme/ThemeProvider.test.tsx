import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@theme/ThemeProvider'
import { THEME_STORAGE_KEY } from '@theme/constants'
import { initializeTheme } from '@theme/initializeTheme'

import { ThemeSwitcher } from '@components/ui/ThemeSwitcher'

describe('theme preferences', () => {
	let dark = false
	let listeners: Set<() => void>
	const changeSystem = (next: boolean) => {
		dark = next
		act(() => listeners.forEach(listener => listener()))
	}
	const mount = () =>
		render(
			<ThemeProvider>
				<ThemeSwitcher />
			</ThemeProvider>
		)

	beforeEach(() => {
		localStorage.clear()
		dark = false
		listeners = new Set()
		vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
			get matches() {
				return dark
			},
			media: query,
			onchange: null,
			addEventListener: (
				_event: string,
				listener: EventListenerOrEventListenerObject
			) => {
				listeners.add(listener as () => void)
			},
			removeEventListener: (
				_event: string,
				listener: EventListenerOrEventListenerObject
			) => {
				listeners.delete(listener as () => void)
			},
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: () => true
		}))
	})
	afterEach(() => {
		cleanup()
		localStorage.clear()
		vi.restoreAllMocks()
	})

	it('follows system changes until an explicit preference is selected and remembers it', async () => {
		const user = userEvent.setup()
		const view = mount()
		const select = screen.getByRole('combobox', { name: 'Theme' })
		expect(select).toHaveValue('system')
		changeSystem(true)
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
		await user.selectOptions(select, 'light')
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
		changeSystem(false)
		changeSystem(true)
		expect(document.documentElement).toHaveAttribute('data-theme', 'light')
		view.unmount()
		mount()
		expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('light')
		await user.selectOptions(
			screen.getByRole('combobox', { name: 'Theme' }),
			'system'
		)
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
		changeSystem(false)
		expect(document.documentElement.style.colorScheme).toBe('light')
	})

	it('applies saved preferences before rendering and falls back for invalid values', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'dark')
		initializeTheme()
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
		localStorage.setItem(THEME_STORAGE_KEY, 'invalid')
		initializeTheme()
		expect(document.documentElement).toHaveAttribute(
			'data-theme-mode',
			'system'
		)
		expect(document.documentElement).toHaveAttribute('data-theme', 'light')
	})

	it('synchronizes changes from another tab and removes subscriptions on unmount', async () => {
		const view = mount()
		await act(() =>
			window.dispatchEvent(
				new StorageEvent('storage', {
					key: THEME_STORAGE_KEY,
					newValue: 'dark'
				})
			)
		)
		expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
		await act(() =>
			window.dispatchEvent(new StorageEvent('storage', { key: null }))
		)
		expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue(
			'system'
		)
		view.unmount()
		expect(listeners.size).toBe(0)
	})

	it('still switches themes when browser storage is unavailable', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('Storage blocked')
		})
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('Storage blocked')
		})
		initializeTheme()
		mount()
		await userEvent
			.setup()
			.selectOptions(screen.getByRole('combobox', { name: 'Theme' }), 'dark')
		expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
	})
})
