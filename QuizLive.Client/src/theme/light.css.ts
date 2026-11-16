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

export const lightTheme = createTheme(vars, {
	colors: {
		bg: palette.white,
		surface: palette.gray50,
		surfaceRaised: palette.white,
		text: palette.gray500,
		textMuted: palette.gray400,
		textHeading: palette.black,
		primary: palette.purple500,
		primaryHover: palette.purple600,
		onPrimary: palette.white,
		primaryMuted: 'rgba(170, 59, 255, 0.1)',
		primaryBorder: 'rgba(170, 59, 255, 0.5)',
		success: palette.green600,
		successMuted: 'rgba(34, 197, 94, 0.12)',
		danger: palette.red600,
		dangerMuted: 'rgba(239, 68, 68, 0.12)',
		warning: palette.amber500,
		warningMuted: 'rgba(245, 158, 11, 0.12)',
		info: palette.blue500,
		infoMuted: 'rgba(59, 130, 246, 0.12)',
		border: palette.gray200,
		borderStrong: palette.gray400,
		focusRing: palette.purple500,
		overlay: 'rgba(8, 6, 13, 0.45)',
		codeBg: '#f4f3ec',
	},
	spacing,
	radii,
	fontSizes,
	fontWeights,
	lineHeights,
	shadows,
	zIndices,
	durations,
	fonts,
})

globalStyle(`.${lightTheme}`, {
	colorScheme: 'light',
})
