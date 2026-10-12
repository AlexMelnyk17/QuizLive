import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../QuizLive.Server/wwwroot', // шлях до папки бекенду
        emptyOutDir: true
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:7118', // Порт твого бекенду (з логів)
                secure: false
            }
        }
    }
})
