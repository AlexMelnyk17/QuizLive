import type { ProblemDetailsDto } from '@api/types'

export type ProblemDetailsBody = ProblemDetailsDto

export class ApiError extends Error {
	readonly status: number
	readonly title?: string
	readonly detail?: string
	readonly errors?: Record<string, string[]>
	readonly remainingAttempts?: number
	readonly lockoutEndUtc?: string

	constructor(status: number, body: ProblemDetailsBody) {
		super(body.detail ?? body.title ?? `Request failed with status ${status}`)
		this.name = 'ApiError'
		this.status = status
		this.title = body.title
		this.detail = body.detail
		this.errors = body.errors
		this.remainingAttempts = body.remainingAttempts
		this.lockoutEndUtc = body.lockoutEndUtc
	}
}

export async function parseProblemResponse(
	response: Response
): Promise<ProblemDetailsBody> {
	const contentType = response.headers.get('content-type') ?? ''
	if (contentType.includes('application/problem+json')) {
		try {
			return (await response.json()) as ProblemDetailsBody
		} catch {
			return { status: response.status }
		}
	}
	return { status: response.status }
}
