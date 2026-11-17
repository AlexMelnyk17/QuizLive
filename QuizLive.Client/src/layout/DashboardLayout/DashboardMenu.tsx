import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import {
	menuAccount,
	menuIdentity,
	menuLink,
	menuNavigation,
	menuPanel,
	menuRoot,
	menuTheme
} from '@layout/DashboardLayout/DashboardMenu.css'
import { DASHBOARD_LAYOUT_COPY } from '@layout/constants'

import { Avatar } from '@components/ui/Avatar'
import { Button } from '@components/ui/Button'
import { Icon } from '@components/ui/Icon'
import { IconButton } from '@components/ui/IconButton'
import { Text } from '@components/ui/Text'
import { ThemeSwitcher } from '@components/ui/ThemeSwitcher'

import { useSession } from '@modules/auth/store/sessionStore'

import { PATHS } from '@config/routes'

export function DashboardMenu({ onSignOut }: { onSignOut: () => void }) {
	const [open, setOpen] = useState(false)
	const root = useRef<HTMLDivElement>(null)
	const panel = useRef<HTMLDivElement>(null)
	const id = useId()
	const session = useSession()
	const close = () => {
		setOpen(false)
		root.current?.querySelector('button')?.focus()
	}

	useEffect(() => {
		if (!open) return
		panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
		const dismissOutside = (event: PointerEvent | FocusEvent) => {
			if (event.target instanceof Node && !root.current?.contains(event.target))
				setOpen(false)
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				setOpen(false)
				root.current?.querySelector('button')?.focus()
			}
		}
		document.addEventListener('pointerdown', dismissOutside)
		document.addEventListener('focusin', dismissOutside)
		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('pointerdown', dismissOutside)
			document.removeEventListener('focusin', dismissOutside)
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [open])

	return (
		<div className={menuRoot} ref={root}>
			<IconButton
				variant='outline'
				aria-label={
					open
						? DASHBOARD_LAYOUT_COPY.closeMenu
						: DASHBOARD_LAYOUT_COPY.openMenu
				}
				aria-expanded={open}
				aria-controls={id}
				onClick={() => setOpen(value => !value)}
				icon={<Icon icon={open ? X : Menu} />}
			/>
			{open && (
				<div id={id} className={menuPanel} ref={panel}>
					<nav
						className={menuNavigation}
						aria-label={DASHBOARD_LAYOUT_COPY.hostNavLabel}
					>
						<Link
							to={PATHS.dashboard}
							activeOptions={{ exact: true }}
							className={menuLink}
							onClick={close}
						>
							{DASHBOARD_LAYOUT_COPY.navQuizzes}
						</Link>
						<Link to={PATHS.statistics} className={menuLink} onClick={close}>
							{DASHBOARD_LAYOUT_COPY.navStatistics}
						</Link>
					</nav>
					<div className={menuAccount}>
						{session && (
							<>
								<div className={menuIdentity}>
									<Avatar name={session.user.userName} size='sm' />
									<Text size='sm' weight='medium'>
										{session.user.userName}
									</Text>
								</div>
								<Button
									variant='outline'
									size='sm'
									fullWidth
									onClick={() => {
										close()
										onSignOut()
									}}
								>
									{DASHBOARD_LAYOUT_COPY.signOut}
								</Button>
							</>
						)}
						<div className={menuTheme}>
							<Text size='sm'>{DASHBOARD_LAYOUT_COPY.theme}</Text>
							<ThemeSwitcher />
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
