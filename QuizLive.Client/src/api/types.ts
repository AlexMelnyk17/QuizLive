export type ProblemDetailsDto = {
	type?: string
	title?: string
	status?: number
	detail?: string
	instance?: string
	errors?: Record<string, string[]>
	remainingAttempts?: number
	lockoutEndUtc?: string
}
