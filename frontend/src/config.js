/**
 * ============================================================
 * TrafficWiz - Frontend API Configuration
 * ============================================================
 * Purpose: Central configuration for backend API endpoints
 * 
 * API_BASE:
 * - Base URL for all absolute backend API calls
 * - Points to Flask backend running on port 5000
 * - Used by pages that make direct fetch calls (not proxied)
 * 
 * Important:
 * - Vite dev server proxies relative /api/* calls automatically
 * - This constant is for pages using absolute URLs
 * - Must match the backend server port (see backend/.env)
 * 
 * Production:
 * - Update this to production backend URL before deployment
 * - Example: "https://api.trafficwiz.com"
 * ============================================================
 */

// Backend API base URL - Flask server on port 5000
export const API_BASE = "http://127.0.0.1:5000";

// HERE Maps API Configuration
export const HERE_CONFIG = {
  apiKey: "_Y8zyahHf6R_i8_nlICiLjVeIQAySkuVSBpmm5LDaUU",
  baseUrl: "https://api.here.com"
};
