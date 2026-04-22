import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Bind IPv4 + IPv6 so http://127.0.0.1:5173 and http://localhost:5173 both work on Windows
    host: true,
  },
})
