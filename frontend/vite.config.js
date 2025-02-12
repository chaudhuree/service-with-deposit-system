import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'f0db-182-252-68-225.ngrok-free.app', // Add your Ngrok domain here
      'localhost',
      '127.0.0.1', // Optional: Allow local IP addresses
      '0.0.0.0' // Optional: Allow all hosts (not recommended for production)
    ]
  }
})
