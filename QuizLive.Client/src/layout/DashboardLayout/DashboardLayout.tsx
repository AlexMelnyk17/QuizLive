import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Avatar } from '@components/ui/Avatar'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { signOut, useSession } from '@modules/auth'

import {
	dashboardHeader,
	dashboardHeaderActions,
	dashboardHeaderUser,
	dashboardMain,
	dashboardRoot,
} from '@layout/DashboardLayout/DashboardLayout.css'

export type DashboardLayoutProps = {
	children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const navigate = useNavigate()
	const session = useSession()

	const handleSignOut = () => {
		signOut()
		void navigate({ to: '/' })
	}

	return (
		<div className={dashboardRoot}>
			<header className={dashboardHeader}>
				<Heading level={2}>My quizzes</Heading>
				<div className={dashboardHeaderActions}>
					<Button
						variant="primary"
						disabled
						aria-label="Create quiz (not available yet)"
					>
						Create quiz
					</Button>
					{session ? (
						<div className={dashboardHeaderUser}>
							<Avatar name={session.user.userName} size="sm" />
							<Text size="sm" weight="medium">
								{session.user.userName}
							</Text>
							<Button variant="outline" size="sm" onClick={handleSignOut}>
								Sign out
							</Button>
						</div>
					) : null}
				</div>
			</header>
			<main className={dashboardMain}>{children}</main>
		</div>
	)
}
