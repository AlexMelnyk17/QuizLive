import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
	mode: ThemeMode
	resolved: 'light' | 'dark'
	setMode: (mode: ThemeMode) => void
	toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
