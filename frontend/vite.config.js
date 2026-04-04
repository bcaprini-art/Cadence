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
    host: true, // allow external connections
    allowedHosts: 'all', // allow ngrok and any other host
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:4001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
