import { GAME_STATS_PAGE_COPY } from '@modules/statistics/constants'

export function formatGamePlayerLine(player: {
	nickname: string
	answerCount: number
	totalPoints: number | null
}): string {
	const answers = GAME_STATS_PAGE_COPY.playerAnswers(player.answerCount)
	if (player.totalPoints === null) {
		return `${player.nickname}${GAME_STATS_PAGE_COPY.playerNameSeparator}${answers}`
	}

	return `${player.nickname}${GAME_STATS_PAGE_COPY.playerNameSeparator}${answers}${GAME_STATS_PAGE_COPY.playerMetaSeparator}${GAME_STATS_PAGE_COPY.playerPoints(player.totalPoints)}`
}
