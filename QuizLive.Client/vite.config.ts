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
			},
		}
  },
})
