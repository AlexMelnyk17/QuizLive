import type { UseQueryResult } from '@tanstack/react-query'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	STATISTICS_CHART_COPY,
	STATISTICS_KPI_LABELS,
	STATISTICS_PAGE_COPY,
} from '@modules/statistics/constants'
import { StatisticsPage } from '@modules/statistics/components/StatisticsPage'
import type { HostStats } from '@modules/statistics/types'
import { renderWithTheme } from '@src/test/testUtils'

type HostStatsQuery = Pick<
	UseQueryResult<HostStats>,
	'isPending' | 'isError' | 'data' | 'refetch' | 'isFetching'
>

const emptyStats: HostStats = {
	quizzes: {
		total: 0,
		archived: 0,
		byKind: { openText: 0, pollChoice: 0, quizChoice: 0 },
	},
	questions: { total: 0, averagePerQuiz: 0 },
	games: {
		total: 0,
		finished: 0,
		byStatus: { lobby: 0, question: 0, results: 0, finished: 0 },
		byKind: { openText: 0, pollChoice: 0, quizChoice: 0 },
	},
	players: { totalJoins: 0, averagePerGame: 0, maxInOneGame: 0 },
	activity: {
		gamesLast7Days: 0,
		gamesLast30Days: 0,
		gamesPerDay: Array.from({ length: 30 }, (_, offset) => ({
			date: `2026-10-${String(offset + 1).padStart(2, '0')}`,
			count: 0,
		})),
	},
}

const sampleStats: HostStats = {
	...emptyStats,
	quizzes: { ...emptyStats.quizzes, total: 2 },
	games: {
		total: 4,
		finished: 2,
		byStatus: { lobby: 1, question: 0, results: 1, finished: 2 },
		byKind: { openText: 2, pollChoice: 1, quizChoice: 1 },
	},
	players: { totalJoins: 10, averagePerGame: 2.5, maxInOneGame: 5 },
}

const useHostStatsMock = vi.fn<() => HostStatsQuery>()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => vi.fn(),
}))

vi.mock('@modules/auth', () => ({
	useSession: () => ({
		token: 't',
		expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
		user: { id: '1', userName: 'quizzer' },
	}),
	signOut: vi.fn(),
}))

vi.mock('@modules/statistics/hooks/useHostStats', () => ({
	useHostStats: (): HostStatsQuery => useHostStatsMock(),
}))

describe('StatisticsPage', () => {
	beforeEach(() => {
		useHostStatsMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('shows skeletons while loading', () => {
		useHostStatsMock.mockReturnValue({
			isPending: true,
			isError: false,
			data: undefined,
			refetch: vi.fn(),
			isFetching: false,
		})

		renderWithTheme(<StatisticsPage />)

		expect(
			screen.getByRole('heading', { name: STATISTICS_PAGE_COPY.title })
		).toBeInTheDocument()
		expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(
			0
		)
	})

	it('shows error with retry', async () => {
		const user = userEvent.setup()
		const refetch = vi.fn()

		useHostStatsMock
			.mockReturnValueOnce({
				isPending: false,
				isError: true,
				data: undefined,
				refetch,
				isFetching: false,
			})
			.mockReturnValueOnce({
				isPending: false,
				isError: true,
				data: undefined,
				refetch,
				isFetching: true,
			})
			.mockReturnValue({
				isPending: false,
				isError: false,
				data: sampleStats,
				refetch,
				isFetching: false,
			})

		renderWithTheme(<StatisticsPage />)

		expect(
			screen.getByText(STATISTICS_PAGE_COPY.loadError.title)
		).toBeInTheDocument()

		await user.click(
			screen.getByRole('button', { name: STATISTICS_PAGE_COPY.loadError.retry })
		)

		await waitFor(() => {
			expect(refetch).toHaveBeenCalled()
		})
	})

	it('shows empty message and zero KPIs', () => {
		useHostStatsMock.mockReturnValue({
			isPending: false,
			isError: false,
			data: emptyStats,
			refetch: vi.fn(),
			isFetching: false,
		})

		renderWithTheme(<StatisticsPage />)

		expect(screen.getByText(STATISTICS_PAGE_COPY.noActivity)).toBeInTheDocument()
		expect(screen.getByText(STATISTICS_KPI_LABELS.quizzes)).toBeInTheDocument()
		expect(screen.getAllByText('0').length).toBeGreaterThan(0)
		expect(screen.getByText(STATISTICS_CHART_COPY.gamesOverTime)).toBeInTheDocument()
	})

	it('renders headline KPIs without quiz list copy in main area', () => {
		useHostStatsMock.mockReturnValue({
			isPending: false,
			isError: false,
			data: sampleStats,
			refetch: vi.fn(),
			isFetching: false,
		})

		renderWithTheme(<StatisticsPage />)

		expect(screen.getByRole('heading', { name: '2' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '4' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '10' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: /^2[.,]5$/ })).toBeInTheDocument()
		expect(screen.getByText(STATISTICS_CHART_COPY.gamesByKind)).toBeInTheDocument()
		expect(screen.queryByText(/Your quizzes will be listed/i)).not.toBeInTheDocument()
	})
})