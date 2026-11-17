import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { ThemeProvider } from '@theme/ThemeProvider'

export const LAZY_UI_TIMEOUT_MS = 5000

export function renderWithTheme(ui: ReactElement) {
	return render(<ThemeProvider>{ui}</ThemeProvider>)
}
