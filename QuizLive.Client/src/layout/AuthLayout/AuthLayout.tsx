import type { ReactNode } from 'react'

import { Card } from '@components/ui/Card'
import { Stack } from '@components/ui/Stack'

import { authCard, authPage, authStack } from '@layout/AuthLayout/AuthLayout.css'

export type AuthLayoutProps = {
	children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className={authPage}>
			<Card className={authCard} padding="lg" variant="elevated" fullWidth>
				<Stack direction="column" align="stretch" className={authStack}>
					{children}
				</Stack>
			</Card>
		</div>
	)
}
