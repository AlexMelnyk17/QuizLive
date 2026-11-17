import { Skeleton } from '@components/ui/Skeleton'

import {
	statsChartGrid,
	statsKpiGrid,
	statsPage
} from '@modules/statistics/components/StatisticsPage.css'
import {
	statsSkeletonChart,
	statsSkeletonKpi
} from '@modules/statistics/components/StatsPageSkeleton.css'

export type StatsPageSkeletonProps = {
	kpiCount: number
	chartCount?: number
}

export function StatsPageSkeleton({
	kpiCount,
	chartCount = 0
}: StatsPageSkeletonProps) {
	return (
		<div className={statsPage}>
			<div className={statsKpiGrid}>
				{Array.from({ length: kpiCount }, (_, index) => (
					<Skeleton key={index} variant='rect' className={statsSkeletonKpi} />
				))}
			</div>
			{chartCount > 0 ? (
				<div className={statsChartGrid}>
					{Array.from({ length: chartCount }, (_, index) => (
						<Skeleton
							key={index}
							variant='rect'
							className={statsSkeletonChart}
						/>
					))}
				</div>
			) : null}
		</div>
	)
}
