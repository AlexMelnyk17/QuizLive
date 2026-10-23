export const QuizKind = {
	OpenText: 0,
	PollChoice: 1,
	QuizChoice: 2,
} as const

export type QuizKindValue = (typeof QuizKind)[keyof typeof QuizKind]

export type QuizDto = {
	id: number
	title: string
	description: string | null
	kind: QuizKindValue
	isArchived: boolean
	createdAtUtc: string
	questionCount: number
}
