/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true
	},
	build: {
		outDir: '../QuizLive.Server/wwwroot',
		emptyOutDir: true
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		env: {
			VITE_API_BASE_URL: '/api'
		}
	}
})
