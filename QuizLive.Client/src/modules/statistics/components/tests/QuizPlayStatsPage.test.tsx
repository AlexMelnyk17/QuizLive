import type { UseQueryResult } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QuizKind } from '@modules/quizzes/constants'
import { QuizPlayStatsPage } from '@modules/statistics/components/QuizPlayStatsPage'
import {
	QUIZ_STATS_PAGE_COPY,
	STATISTICS_CHART_COPY
} from '@modules/statistics/constants'
import type { QuizPlayStats } from '@modules/statistics/types'

import { LAZY_UI_TIMEOUT_MS, renderWithTheme } from '@src/test/testUtils'

type QuizStatsQuery = Pick<
	UseQueryResult<QuizPlayStats>,
	'isPending' | 'isError' | 'data' | 'refetch' | 'isFetching' | 'error'
>

const sampleQuizStats: QuizPlayStats = {
	quizId: 7,
	quizTitle: 'STEM basics',
	kind: QuizKind.QuizChoice,
	questionCount: 1,
	games: {
		total: 2,
		finished: 1,
		lastPlayedAtUtc: '2026-11-16T12:00:00Z',
		averageDurationSeconds: 90
	},
	players: { totalJoins: 3, averagePerGame: 1.5, maxInOneGame: 3 },
	activity: {
		gamesLast7Days: 1,
		gamesLast30Days: 1,
		gamesPerDay: [{ date: '2026-11-16', count: 1 }]
	},
	runs: [],
	quizChoiceQuestions: [
		{
			questionId: 1,
			order: 1,
			text: 'Is water H2O?',
			playerAnsweredCount: 1,
			possibleAnswers: 3,
			correctCount: 1,
			correctPercent: 100,
			averageElapsedMs: null,
			averagePoints: 50,
			options: [
				{
					optionId: 1,
					order: 1,
					text: 'Yes',
					count: 1,
					isCorrect: true
				}
			]
		}
	],
	pollQuestions: null,
	openQuestions: null
}

const useQuizStatsMock = vi.fn<() => QuizStatsQuery>()

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ quizId: '7' }),
	useNavigate: () => vi.fn(),
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	)
}))

vi.mock('@modules/auth', () => ({
	useSession: () => ({
		token: 't',
		expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
		user: { id: '1', userName: 'quizzer' }
	}),
	signOut: vi.fn()
}))

vi.mock('@modules/statistics/hooks/useQuizStats', () => ({
	useQuizStats: (): QuizStatsQuery => useQuizStatsMock()
}))

describe('QuizPlayStatsPage', () => {
	beforeEach(() => {
		useQuizStatsMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('shows empty finished-runs message and question charts', async () => {
		useQuizStatsMock.mockReturnValue({
			isPending: false,
			isError: false,
			data: sampleQuizStats,
			refetch: vi.fn(),
			isFetching: false,
			error: null
		})

		renderWithTheme(<QuizPlayStatsPage />)

		expect(
			screen.getByText(QUIZ_STATS_PAGE_COPY.noFinishedRuns)
		).toBeInTheDocument()
		expect(
			await screen.findByText(
				STATISTICS_CHART_COPY.questionCorrectPercent,
				undefined,
				{ timeout: LAZY_UI_TIMEOUT_MS }
			)
		).toBeInTheDocument()
	})

	it('retries after load error', async () => {
		const user = userEvent.setup()
		const refetch = vi.fn()
		useQuizStatsMock.mockReturnValue({
			isPending: false,
			isError: true,
			data: undefined,
			refetch,
			isFetching: false,
			error: new Error('fail')
		})

		renderWithTheme(<QuizPlayStatsPage />)

		await user.click(
			screen.getByRole('button', { name: QUIZ_STATS_PAGE_COPY.loadError.retry })
		)

		expect(refetch).toHaveBeenCalled()
	})
})
