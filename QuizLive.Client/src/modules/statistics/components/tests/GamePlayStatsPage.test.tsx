import type { UseQueryResult } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GamePlayStatsPage } from '@modules/statistics/components/GamePlayStatsPage'
import {
	GAME_STATS_KPI_LABELS,
	GAME_STATS_PAGE_COPY
} from '@modules/statistics/constants'
import type { GamePlayStats } from '@modules/statistics/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

type GameStatsQuery = Pick<
	UseQueryResult<GamePlayStats>,
	'isPending' | 'isError' | 'data' | 'refetch' | 'isFetching' | 'error'
>

const useGameStatsMock = vi.fn<() => GameStatsQuery>()

vi.mock('@tanstack/react-router', () => ({
	useParams: () => ({ quizId: '7', gameId: '42' }),
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

vi.mock('@modules/statistics/hooks/useGameStats', () => ({
	useGameStats: (): GameStatsQuery => useGameStatsMock()
}))

describe('GamePlayStatsPage', () => {
	beforeEach(() => {
		useGameStatsMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('shows loading skeleton while pending', () => {
		useGameStatsMock.mockReturnValue({
			isPending: true,
			isError: false,
			data: undefined,
			refetch: vi.fn(),
			isFetching: false,
			error: null
		})

		renderWithTheme(<GamePlayStatsPage />)

		expect(
			screen.queryByText(GAME_STATS_KPI_LABELS.players)
		).not.toBeInTheDocument()
	})

	it('shows not-finished message on 409 conflict', () => {
		useGameStatsMock.mockReturnValue({
			isPending: false,
			isError: true,
			data: undefined,
			refetch: vi.fn(),
			isFetching: false,
			error: new ApiError(HTTP_STATUS.CONFLICT, {
				status: HTTP_STATUS.CONFLICT,
				detail: 'Game not finished'
			})
		})

		renderWithTheme(<GamePlayStatsPage />)

		expect(
			screen.getByText(GAME_STATS_PAGE_COPY.notFinished.title)
		).toBeInTheDocument()
		expect(
			screen.getByText(GAME_STATS_PAGE_COPY.notFinished.body)
		).toBeInTheDocument()
		expect(
			screen.getAllByRole('button', {
				name: GAME_STATS_PAGE_COPY.backToQuizStats
			})
		).toHaveLength(2)
	})
})
