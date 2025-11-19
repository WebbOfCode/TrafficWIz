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

// TomTom API Configuration
export const TOMTOM_CONFIG = {
  apiKey: "YOUR_TOMTOM_API_KEY_HERE", // Replace with your actual API key
  baseUrl: "https://api.tomtom.com",
  mapStyle: "main",
  version: "1"
};
