import { Link, useNavigate } from '@tanstack/react-router'

import { PATHS } from '@config/routes'

import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { useSession } from '@modules/auth/store/sessionStore'
import { HOME_COPY, HOME_TITLE } from '@modules/home/constants'
import {
	homePage,
	hostSection,
	inlineLink,
	section,
} from '@modules/home/components/HomePage.css'
import { JoinByCodePanel } from '@modules/join/components/JoinByCodePanel'

export function HomePage() {
	const navigate = useNavigate()
	const session = useSession()

	return (
		<main className={homePage}>
			<Heading level={1}>{HOME_TITLE}</Heading>

			<section className={section} aria-labelledby="join-heading">
				<Heading level={2} id="join-heading">
					{HOME_COPY.joinSectionTitle}
				</Heading>
				<JoinByCodePanel autoFocus />
			</section>

			<section
				className={`${section} ${hostSection}`}
				aria-labelledby="host-heading"
			>
				<Heading level={2} id="host-heading">
					{HOME_COPY.hostSectionTitle}
				</Heading>
				<Text tone="muted">
					{HOME_COPY.hostBody}
				</Text>
				{session ? (
					<Button
						variant="secondary"
						onClick={() => void navigate({ to: PATHS.dashboard })}
					>
						{HOME_COPY.goToDashboard}
					</Button>
				) : (
					<Text>
						<Link to={PATHS.login} className={inlineLink}>
							{HOME_COPY.logIn}
						</Link>
						{HOME_COPY.authJoiner}
						<Link to={PATHS.register} className={inlineLink}>
							{HOME_COPY.register}
						</Link>
						{HOME_COPY.authSuffix}
					</Text>
				)}
			</section>
		</main>
	)
}