export const SESSION_STORAGE_KEY = 'quizlive-session'

export const AUTH_FIELD_LIMITS = {
	userNameMin: 3,
	userNameMax: 50,
	passwordMin: 6,
	passwordMax: 100,
	loginFieldMin: 1
} as const

export const AUTH_COPY = {
	login: {
		title: 'Log in',
		subtitle: 'Sign in to create and manage your quizzes.',
		errorTitle: 'Could not log in',
		userNameLabel: 'User name',
		passwordLabel: 'Password',
		submit: 'Log in',
		noAccount: 'No account yet?',
		registerLink: 'Register'
	},
	register: {
		title: 'Register',
		subtitle: 'Create an account to host your own quizzes.',
		errorTitle: 'Could not register',
		userNameLabel: 'User name',
		passwordLabel: 'Password',
		submit: 'Create account',
		hasAccount: 'Already have an account?',
		loginLink: 'Log in',
		failed: 'Registration failed.',
		failedRetry: 'Registration failed. Please try again.',
		userNameTaken: 'User name is already taken.'
	},
	validation: {
		userNameRequired: 'User name is required',
		passwordRequired: 'Password is required',
		userNameMin: `User name must be at least ${AUTH_FIELD_LIMITS.userNameMin} characters`,
		userNameMax: `User name must be at most ${AUTH_FIELD_LIMITS.userNameMax} characters`,
		passwordMin: `Password must be at least ${AUTH_FIELD_LIMITS.passwordMin} characters`,
		passwordMax: `Password must be at most ${AUTH_FIELD_LIMITS.passwordMax} characters`,
		passwordLowercase: 'At least one lowercase letter is required.',
		passwordDigit: 'At least one digit is required.'
	},
	errors: {
		loginFailed: 'Login failed. Please try again.',
		invalidCredentials: 'Invalid user name or password.',
		remainingAttempts: (count: number) => `Remaining attempts: ${count}.`,
		lockoutRetry: (when: string) => `Try again after ${when}.`
	}
} as const
