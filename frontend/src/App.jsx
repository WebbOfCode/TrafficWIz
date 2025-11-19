/**
 * ============================================================
 * TrafficWiz Frontend - Main Application Component
 * ============================================================
 * Purpose: Root component for the React SPA
 * 
 * Responsibilities:
 * - Define application routing (React Router)
 * - Render persistent navbar with navigation links
 * - Apply global dark purple gradient theme
 * - Provide footer with branding
 * 
 * Routes:
 * - /                  - Home page (weather, map, welcome)
 * - /dashboard         - Dashboard with incident summary and table
 * - /incidents         - List of all incidents
 * - /incidents/:id     - Individual incident detail view
 * - /risk              - Risk analysis charts and ML metrics
 * 
 * Styling: Permanent dark mode with purple gradient background
 * ============================================================
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Incidents from "./Pages/Incidents";
import Risk from "./Pages/Risk";
import IncidentDetail from "./Pages/IncidentDetail";
import TomTomTraffic from "./Pages/TomTomTraffic";
function App() {

  return (
    <Router>
      <div
        className={`min-h-screen flex flex-col transition-all duration-500 bg-gradient-to-br from-black via-gray-900 to-violet-900 text-white`}
      >
        {/* ===== NAVBAR ===== */}
        <nav className="bg-black/80 text-white px-6 py-3 flex justify-between items-center shadow-lg border-b border-violet-700">
          {/* Clickable logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <img
              src="/trafficwiz-logo.png"
              alt="TrafficWiz Logo"
              className="w-10 h-10 rounded-full border border-violet-500"
            />
            <h1 className="text-xl font-bold text-violet-400 tracking-wide">
              TrafficWiz
            </h1>
          </Link>

          <div className="flex items-center space-x-6 font-medium">
            <Link to="/dashboard" className="hover:text-violet-400">
              Dashboard
            </Link>
            <Link to="/incidents" className="hover:text-violet-400">
              Incidents
            </Link>
            <Link to="/risk" className="hover:text-violet-400">
              Risk
            </Link>
            <Link to="/tomtom" className="hover:text-violet-400">
              Live Traffic
            </Link>

              {/* controls removed (dark mode & status) */}
          </div>
        </nav>

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/tomtom" element={<TomTomTraffic />} />
          </Routes>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="bg-black/80 text-gray-400 text-center py-3 border-t border-violet-700">
          © {new Date().getFullYear()}{" "}
          <span className="text-violet-400">TrafficWiz</span> — Nashville Analytics
        </footer>
      </div>
    </Router>
  );
}

export default App;
