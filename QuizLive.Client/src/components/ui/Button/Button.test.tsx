import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@theme/ThemeProvider'

import { Button } from '@components/ui/Button/Button'

function renderWithTheme(ui: ReactElement) {
	return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('Button', () => {
	it('renders label and variants', () => {
		renderWithTheme(
			<>
				<Button>{'Join game'}</Button>
				<Button variant="danger">{'Leave'}</Button>
			</>
		)

		expect(screen.getByRole('button', { name: 'Join game' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument()
	})

	it('shows loading state', () => {
		renderWithTheme(<Button loading>{'Submit'}</Button>)
		expect(screen.getByRole('button', { busy: true })).toBeDisabled()
	})
})
