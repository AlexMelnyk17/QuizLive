import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Avatar } from '@components/ui/Avatar'
import { Button } from '@components/ui/Button'
import { Divider } from '@components/ui/Divider'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { signOut, useSession } from '@modules/auth'

import {
	dashboardHeader,
	dashboardHeaderActions,
	dashboardHeaderNav,
	dashboardHeaderUser,
	dashboardMain,
	dashboardNavLink,
	dashboardRoot,
} from '@layout/DashboardLayout/DashboardLayout.css'

export type DashboardLayoutProps = {
	children: ReactNode
	title?: string
}

export function DashboardLayout({
	children,
	title = 'My quizzes',
}: DashboardLayoutProps) {
	const navigate = useNavigate()
	const session = useSession()

	const handleSignOut = () => {
		signOut()
		void navigate({ to: '/' })
	}

	return (
		<div className={dashboardRoot}>
			<header className={dashboardHeader}>
				<Heading level={2}>{title}</Heading>
				<div className={dashboardHeaderActions}>
					<nav className={dashboardHeaderNav} aria-label="Host area">
						<Link to="/dashboard" className={dashboardNavLink}>
							My quizzes
						</Link>
						<Link to="/statistics" className={dashboardNavLink}>
							Statistics
						</Link>
					</nav>
					<Divider orientation="vertical" length="short" spacing="sm" />
					<Button
						variant="primary"
						disabled
						aria-label="Create quiz (not available yet)"
					>
						Create quiz
					</Button>
					{session ? (
						<>
							<Divider orientation="vertical" length="short" spacing="sm" />
							<div className={dashboardHeaderUser}>
								<Avatar name={session.user.userName} size="sm" />
								<Text size="sm" weight="medium">
									{session.user.userName}
								</Text>
								<Button variant="outline" size="sm" onClick={handleSignOut}>
									Sign out
								</Button>
							</div>
						</>
					) : null}
				</div>
			</header>
			<main className={dashboardMain}>{children}</main>
		</div>
	)
}
