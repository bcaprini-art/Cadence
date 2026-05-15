import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:4008',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:4008',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
