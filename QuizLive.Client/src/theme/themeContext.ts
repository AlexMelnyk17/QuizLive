import { createContext } from 'react'

import type { THEME_MODES } from '@theme/constants'

export type ThemeMode = (typeof THEME_MODES)[number]

export type ThemeContextValue = {
	mode: ThemeMode
	resolved: 'light' | 'dark'
	setMode: (mode: ThemeMode) => void
	toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
