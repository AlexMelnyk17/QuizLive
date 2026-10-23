import { ENV } from '@config'

import { ApiError, parseProblemResponse } from '@api/apiError'

export type ApiRequestOptions = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	body?: unknown
	skipAuth?: boolean
}

type ApiClientConfig = {
	getAccessToken: () => string | null
	onUnauthorized: () => void
}

let clientConfig: ApiClientConfig | null = null

export function configureApiClient(config: ApiClientConfig) {
	clientConfig = config
}

function buildUrl(path: string): string {
	const base = ENV.VITE_API_BASE_URL.replace(/\/$/, '')
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return `${base}${normalizedPath}`
}

export async function apiRequest<T>(
	path: string,
	options: ApiRequestOptions = {}
): Promise<T> {
	const { method = 'GET', body, skipAuth = false } = options
	const headers = new Headers({ Accept: 'application/json' })

	if (body !== undefined) {
		headers.set('Content-Type', 'application/json')
	}

	let sentBearer = false
	if (!skipAuth && clientConfig) {
		const token = clientConfig.getAccessToken()
		if (token) {
			headers.set('Authorization', `Bearer ${token}`)
			sentBearer = true
		}
	}

	const response = await fetch(buildUrl(path), {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	})

	if (response.ok) {
		if (response.status === 204) {
			return undefined as T
		}
		const text = await response.text()
		if (!text) {
			return undefined as T
		}
		return JSON.parse(text) as T
	}

	if (response.status === 401 && sentBearer && clientConfig) {
		clientConfig.onUnauthorized()
	}

	const problem = await parseProblemResponse(response)
	throw new ApiError(response.status, problem)
}
