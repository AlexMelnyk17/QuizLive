const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!viteApiBaseUrl) {
	throw new Error(
		'VITE_API_BASE_URL is not set. Add it to .env in QuizLive.Client (see README).'
	)
}

export const ENV = {
	VITE_API_BASE_URL: viteApiBaseUrl
} as const
