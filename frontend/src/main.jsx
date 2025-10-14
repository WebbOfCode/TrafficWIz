/**
 * ============================================================
 * TrafficWiz - React Application Entry Point
 * ============================================================
 * Purpose: Bootstrap and mount the React application to DOM
 * 
 * Responsibilities:
 * - Import global styles (index.css with Tailwind directives)
 * - Create React root and mount to #root div in index.html
 * - Wrap App component in StrictMode for development warnings
 * 
 * StrictMode Benefits:
 * - Identifies unsafe lifecycles
 * - Warns about legacy API usage
 * - Detects unexpected side effects
 * - Only affects development (stripped in production)
 * ============================================================
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
