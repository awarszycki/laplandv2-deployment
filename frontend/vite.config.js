import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Proxy działa tylko w `npm run dev` — kieruje zawsze na lokalny backend,
  // nigdy na produkcję. 127.0.0.1 zamiast localhost, bo Node może
  // rozwiązać localhost na ::1, a backend słucha na IPv4.
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
