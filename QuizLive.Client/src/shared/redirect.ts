/** Same-app path safe for post-login redirect (no open redirect). */
export function sanitizeRedirectPath(
	redirect: string | undefined,
	fallback = '/dashboard'
): string {
	if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
		return fallback
	}
	return redirect
}
