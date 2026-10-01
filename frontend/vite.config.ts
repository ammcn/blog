import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The lazy WritePage chunk bundles the Markdown editor and is only fetched after signing in.
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:8000' },
  },
})
