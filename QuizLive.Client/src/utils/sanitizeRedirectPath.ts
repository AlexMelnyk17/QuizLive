import { PATHS } from '@config/routes'

/** Sanitize the post-login redirect to a safe same-app path (prevents open redirect). */
export function sanitizeRedirectPath(
	redirect: string | undefined,
	fallback = PATHS.dashboard
): string {
	if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
		return fallback
	}
	return redirect
}
