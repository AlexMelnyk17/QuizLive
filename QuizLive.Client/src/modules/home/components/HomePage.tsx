import { Link, useNavigate } from '@tanstack/react-router'

import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { useSession } from '@modules/auth'
import { HOME_TITLE } from '@modules/home/constants'
import {
	homePage,
	hostSection,
	inlineLink,
	section,
} from '@modules/home/components/HomePage.css'
import { JoinByCodePanel } from '@modules/join'

export function HomePage() {
	const navigate = useNavigate()
	const session = useSession()

	return (
		<main className={homePage}>
			<Heading level={1}>{HOME_TITLE}</Heading>

			<section className={section} aria-labelledby="join-heading">
				<Heading level={2} id="join-heading">
					Join a quiz
				</Heading>
				<JoinByCodePanel autoFocus />
			</section>

			<section
				className={`${section} ${hostSection}`}
				aria-labelledby="host-heading"
			>
				<Heading level={2} id="host-heading">
					Host your own quiz
				</Heading>
				<Text tone="muted">
					To create and manage quizzes you need an authorized account.
				</Text>
				{session ? (
					<Button
						variant="secondary"
						onClick={() => void navigate({ to: '/dashboard' })}
					>
						Go to dashboard
					</Button>
				) : (
					<Text>
						<Link to="/login" className={inlineLink}>Log in</Link>
						{' or '}
						<Link to="/register" className={inlineLink}>register</Link>
						{' to get started.'}
					</Text>
				)}
			</section>
		</main>
	)
}
