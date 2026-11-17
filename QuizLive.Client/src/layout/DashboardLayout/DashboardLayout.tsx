import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import {
	dashboardHeader,
	dashboardMain,
	dashboardRoot
} from '@layout/DashboardLayout/DashboardLayout.css'
import { DashboardMenu } from '@layout/DashboardLayout/DashboardMenu'
import { DASHBOARD_LAYOUT_COPY } from '@layout/constants'

import { Heading } from '@components/ui/Heading'

import { signOut } from '@modules/auth/store/sessionStore'

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
				<DashboardMenu onSignOut={handleSignOut} />
			</header>
			<main className={dashboardMain}>{children}</main>
		</div>
	)
}
