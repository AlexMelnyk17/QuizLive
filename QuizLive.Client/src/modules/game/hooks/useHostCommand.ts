import { useState } from 'react'

// Runs one host command and keeps what its button needs: whether it is running and why the server refused.
// On success it stays "running": the game moves on by an event and the view that holds the button goes
// away. Only a refusal gives the button back, so the same command cannot be sent twice by a double click.
export function useHostCommand(command: () => Promise<string | null>) {
	const [error, setError] = useState<string | null>(null)
	const [isRunning, setIsRunning] = useState(false)

	const run = async () => {
		setError(null)
		setIsRunning(true)

		const message = await command()

		if (message) {
			setError(message)
			setIsRunning(false)
		}
	}

	return { run, error, isRunning }
}
