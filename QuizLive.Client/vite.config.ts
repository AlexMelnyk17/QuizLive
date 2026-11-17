/// <reference types="vitest/config" />
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react(), vanillaExtractPlugin()],
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
		},
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/tests/**',
				'src/**/*.test.{ts,tsx}',
				'src/test/**',
				'src/**/*.css.ts',
				'src/**/*.d.ts',
				'src/main.tsx'
			],
			reporter: ['text-summary', 'html', 'cobertura'],
			reportsDirectory: './coverage'
		}
	},
	server: {
		port: 53653,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'https://localhost:7118',
				changeOrigin: true,
				secure: false,
				// SignalR connects to /api/hubs/game over WebSocket; without this the dev server
				// cannot upgrade the connection and the client falls back to long polling.
				ws: true
			}
		}
	}
})
