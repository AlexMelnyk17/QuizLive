export const palette = {
	white: '#ffffff',
	black: '#08060d',
	gray50: '#f9fafb',
	gray100: '#f3f4f6',
	gray200: '#e5e4e7',
	gray400: '#9ca3af',
	gray500: '#6b6375',
	gray700: '#2e303a',
	gray800: '#1f2028',
	gray900: '#16171d',
	purple500: '#aa3bff',
	purple400: '#c084fc',
	purple600: '#9333ea',
	green500: '#22c55e',
	green600: '#16a34a',
	red500: '#ef4444',
	red600: '#dc2626',
	amber500: '#f59e0b',
	blue500: '#3b82f6',
} as const

export const spacing = {
	0: '0',
	1: '0.25rem',
	2: '0.5rem',
	3: '0.75rem',
	4: '1rem',
	5: '1.25rem',
	6: '1.5rem',
	8: '2rem',
	10: '2.5rem',
	12: '3rem',
	16: '4rem',
} as const

export const radii = {
	none: '0',
	sm: '0.25rem',
	md: '0.5rem',
	lg: '0.75rem',
	xl: '1rem',
	full: '9999px',
} as const

export const fontSizes = {
	xs: '0.75rem',
	sm: '0.875rem',
	md: '1rem',
	lg: '1.125rem',
	xl: '1.25rem',
	'2xl': '1.5rem',
	'3xl': '1.875rem',
	'4xl': '2.25rem',
} as const

export const fontWeights = {
	normal: '400',
	medium: '500',
	semibold: '600',
	bold: '700',
} as const

export const lineHeights = {
	tight: '1.2',
	normal: '1.45',
	relaxed: '1.6',
} as const

export const shadows = {
	none: 'none',
	sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
	md: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
	lg: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
} as const

export const zIndices = {
	base: '0',
	dropdown: '100',
	sticky: '200',
	overlay: '300',
	modal: '400',
	toast: '500',
} as const

export const durations = {
	fast: '120ms',
	normal: '200ms',
	slow: '320ms',
} as const

export const fonts = {
	sans: "system-ui, 'Segoe UI', Roboto, sans-serif",
	heading: "system-ui, 'Segoe UI', Roboto, sans-serif",
	mono: 'ui-monospace, Consolas, monospace',
} as const
