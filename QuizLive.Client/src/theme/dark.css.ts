import { createTheme, globalStyle } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'
import {
	durations,
	fontSizes,
	fontWeights,
	fonts,
	lineHeights,
	palette,
	radii,
	shadows,
	spacing,
	zIndices,
} from '@theme/tokens'

export const darkTheme = createTheme(vars, {
	colors: {
		bg: palette.gray900,
		surface: palette.gray800,
		surfaceRaised: '#2f303a',
		text: palette.gray400,
		textMuted: '#6b7280',
		textHeading: palette.gray100,
		primary: palette.purple400,
		primaryHover: palette.purple500,
		onPrimary: palette.black,
		primaryMuted: 'rgba(192, 132, 252, 0.15)',
		primaryBorder: 'rgba(192, 132, 252, 0.5)',
		success: palette.green500,
		successMuted: 'rgba(34, 197, 94, 0.18)',
		danger: palette.red500,
		dangerMuted: 'rgba(239, 68, 68, 0.18)',
		warning: palette.amber500,
		warningMuted: 'rgba(245, 158, 11, 0.18)',
		info: palette.blue500,
		infoMuted: 'rgba(59, 130, 246, 0.18)',
		border: palette.gray700,
		borderStrong: '#4b5563',
		focusRing: palette.purple400,
		overlay: 'rgba(0, 0, 0, 0.6)',
		codeBg: palette.gray800,
	},
	spacing,
	radii,
	fontSizes,
	fontWeights,
	lineHeights,
	shadows: {
		none: shadows.none,
		sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
		md: '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.4)',
		lg: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
	},
	zIndices,
	durations,
	fonts,
})

globalStyle(`.${darkTheme}`, {
	colorScheme: 'dark',
})
