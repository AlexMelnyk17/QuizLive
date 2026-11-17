import { createTheme, globalStyle } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'
import { darkChartColors, darkColors } from '@theme/themeColors'
import {
	durations,
	fontSizes,
	fontWeights,
	fonts,
	lineHeights,
	radii,
	shadows,
	spacing,
	zIndices
} from '@theme/tokens'

export const darkTheme = createTheme(vars, {
	colors: darkColors,
	charts: darkChartColors,
	spacing,
	radii,
	fontSizes,
	fontWeights,
	lineHeights,
	shadows: {
		none: shadows.none,
		sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
		md: '0 4px 6px -2px rgba(0, 0, 0, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.4)',
		lg: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
	},
	zIndices,
	durations,
	fonts
})

globalStyle(`.${darkTheme}`, {
	colorScheme: 'dark'
})
