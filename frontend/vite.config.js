/**
 * ============================================================
 * TrafficWiz - Vite Development Server Configuration
 * ============================================================
 * Purpose: Configure Vite build tool and dev server
 * 
 * Plugins:
 * - @vitejs/plugin-react: Enable React Fast Refresh and JSX
 * 
 * Dev Server Proxy:
 * - Forwards all /api/* requests to backend server
 * - Target: http://127.0.0.1:5000 (Flask backend)
 * - Avoids CORS issues during development
 * - Frontend makes relative calls (fetch('/api/traffic'))
 *   which Vite proxies to http://127.0.0.1:5000/api/traffic
 * 
 * Important:
 * - Proxy only works in development (npm run dev)
 * - Production builds need CORS or same-origin deployment
 * - Backend port must match (see backend/.env PORT setting)
 * ============================================================
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000'
    }
  }
})