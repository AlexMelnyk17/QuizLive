import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import {
	dashboardHeader,
	dashboardHeaderActions,
	dashboardHeaderNav,
	dashboardHeaderUser,
	dashboardMain,
	dashboardNavLink,
	dashboardRoot
} from '@layout/DashboardLayout/DashboardLayout.css'
import { DASHBOARD_LAYOUT_COPY } from '@layout/constants'

import { Avatar } from '@components/ui/Avatar'
import { Button } from '@components/ui/Button'
import { Divider } from '@components/ui/Divider'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'
import { ThemeSwitcher } from '@components/ui/ThemeSwitcher'

import { signOut, useSession } from '@modules/auth/store/sessionStore'

import { PATHS } from '@config/routes'

export type DashboardLayoutProps = {
	children: ReactNode
	title?: string
	onSignOut?: () => void
}

export function DashboardLayout({
	children,
	title = DASHBOARD_LAYOUT_COPY.defaultTitle,
	onSignOut
}: DashboardLayoutProps) {
	const navigate = useNavigate()
	const session = useSession()

	const handleSignOut = () => {
		if (onSignOut) {
			onSignOut()
			return
		}
		signOut()
		void navigate({ to: PATHS.home })
	}

	return (
		<div className={dashboardRoot}>
			<header className={dashboardHeader}>
				<Heading level={2}>{title}</Heading>
				<div className={dashboardHeaderActions}>
					<nav
						className={dashboardHeaderNav}
						aria-label={DASHBOARD_LAYOUT_COPY.hostNavLabel}
					>
						<Link to={PATHS.dashboard} className={dashboardNavLink}>
							{DASHBOARD_LAYOUT_COPY.navQuizzes}
						</Link>
						<Link to={PATHS.statistics} className={dashboardNavLink}>
							{DASHBOARD_LAYOUT_COPY.navStatistics}
						</Link>
					</nav>
					<Divider orientation='vertical' length='short' spacing='sm' />
					<Button
						variant='primary'
						onClick={() => void navigate({ to: PATHS.quizCreate })}
					>
						{DASHBOARD_LAYOUT_COPY.createQuiz}
					</Button>
					{session ? (
						<>
							<Divider orientation='vertical' length='short' spacing='sm' />
							<div className={dashboardHeaderUser}>
								<Avatar name={session.user.userName} size='sm' />
								<Text size='sm' weight='medium'>
									{session.user.userName}
								</Text>
								<Button variant='outline' size='sm' onClick={handleSignOut}>
									{DASHBOARD_LAYOUT_COPY.signOut}
								</Button>
							</div>
						</>
					) : null}
					<ThemeSwitcher />
				</div>
			</header>
			<main className={dashboardMain}>{children}</main>
		</div>
	)
}
