import type { z } from 'zod'

import type { hostStatsSchema } from '@modules/statistics/schemas'

export type HostStats = z.infer<typeof hostStatsSchema>

export type KindCounts = HostStats['quizzes']['byKind']

export type StatusCounts = HostStats['games']['byStatus']

export type GamesPerDay = HostStats['activity']['gamesPerDay'][number]