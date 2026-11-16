import {
	statsChartColors,
	statsChartSeries,
} from '@modules/statistics/chartColors'
import {
	treemapLabelBox,
	treemapLabelText,
} from '@modules/statistics/components/charts/OpenTextTreemapCell.css'
import {
	STATISTICS_CHART_STROKE_WIDTH,
	STATISTICS_TREEMAP_CELL_PADDING,
	STATISTICS_TREEMAP_LABEL_TRUNCATE,
	STATISTICS_TREEMAP_MIN_CELL_SIZE,
	STATISTICS_TREEMAP_MIN_LABEL_HEIGHT,
	STATISTICS_TREEMAP_MIN_LABEL_WIDTH,
} from '@modules/statistics/constants'
import { truncateLabel } from '@modules/statistics/utils/truncateLabel'

export type OpenTextTreemapCellProps = {
	x?: number
	y?: number
	width?: number
	height?: number
	index?: number
	name?: string
}

export function OpenTextTreemapCell({
	x = 0,
	y = 0,
	width = 0,
	height = 0,
	index = 0,
	name = '',
}: OpenTextTreemapCellProps) {

	if (
		width < STATISTICS_TREEMAP_MIN_CELL_SIZE ||
		height < STATISTICS_TREEMAP_MIN_CELL_SIZE
	) {
		return null
	}

	const fill = statsChartSeries[index % statsChartSeries.length]
	const showLabel =
		width >= STATISTICS_TREEMAP_MIN_LABEL_WIDTH &&
		height >= STATISTICS_TREEMAP_MIN_LABEL_HEIGHT &&
		name.length > 0
	const label = truncateLabel(name, STATISTICS_TREEMAP_LABEL_TRUNCATE)
	const innerWidth = Math.max(
		0,
		width - STATISTICS_TREEMAP_CELL_PADDING * 2,
	)
	const innerHeight = Math.max(
		0,
		height - STATISTICS_TREEMAP_CELL_PADDING * 2,
	)

	const renderLabel = () => {
		if (!showLabel) {
			return null
		}

		return (
			<foreignObject
				x={x + STATISTICS_TREEMAP_CELL_PADDING}
				y={y + STATISTICS_TREEMAP_CELL_PADDING}
				width={innerWidth}
				height={innerHeight}
			>
				<div title={name} className={treemapLabelBox}>
					<span className={treemapLabelText}>{label}</span>
				</div>
			</foreignObject>
		)
	}

	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={height}
				fill={fill}
				stroke={statsChartColors.stroke}
				strokeWidth={STATISTICS_CHART_STROKE_WIDTH}
			/>
			{renderLabel()}
		</g>
	)
}
