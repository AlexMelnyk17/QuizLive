import type { ReactNode } from 'react'

import {
	authCard,
	authContent,
	authPage,
	authStack,
	authToolbar
} from '@layout/AuthLayout/AuthLayout.css'

import { Card } from '@components/ui/Card'
import { Stack } from '@components/ui/Stack'
import { ThemeSwitcher } from '@components/ui/ThemeSwitcher'

export type AuthLayoutProps = {
	children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className={authPage}>
			<div className={authToolbar}>
				<ThemeSwitcher />
			</div>
			<div className={authContent}>
				<Card className={authCard} padding='lg' variant='elevated' fullWidth>
					<Stack direction='column' align='stretch' className={authStack}>
						{children}
					</Stack>
				</Card>
			</div>
		</div>
	)
}
