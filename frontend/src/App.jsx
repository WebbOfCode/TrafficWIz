import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Incidents from "./Pages/Incidents";
import Risk from "./Pages/Risk";
import IncidentDetail from "./Pages/IncidentDetail";
import StatusBadge from "./components/StatusBadge";

function App() {
  const [darkMode, setDarkMode] = useState(true); // start in dark mode

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Router>
      <div
        className={`min-h-screen flex flex-col transition-all duration-500 ${
          darkMode
            ? "bbg-gradient-to-br from-black via-gray-900 to-violet-900 text-white"
            : "bg-gradient-to-br from-gray-100 via-gray-200 to-white text-gray-900"
        }`}
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

            <StatusBadge />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 bg-violet-700 rounded text-sm hover:bg-violet-600 transition"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </nav>

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Home darkMode={darkMode} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/risk" element={<Risk />} />
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
