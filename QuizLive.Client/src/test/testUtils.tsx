import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { ThemeProvider } from '@theme/ThemeProvider'

export function renderWithTheme(ui: ReactElement) {
	return render(<ThemeProvider>{ui}</ThemeProvider>)
}
