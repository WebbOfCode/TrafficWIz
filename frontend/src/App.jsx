import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Incidents from "./Pages/Incidents";
import Risk from "./Pages/Risk";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* ===== NAVBAR ===== */}
        <nav className="bg-black/90 text-white px-6 py-3 flex justify-between shadow-lg border-b border-violet-700">
          <div className="flex items-center space-x-3">
            <img
              src="/trafficwiz-logo.png"
              alt="TrafficWiz Logo"
              className="w-10 h-10 rounded-full border border-violet-500"
            />
            <h1 className="text-xl font-bold text-violet-400 tracking-wide">
              TrafficWiz
            </h1>
          </div>

          <div className="space-x-6 font-medium">
            <Link to="/" className="hover:text-violet-400">Home</Link>
            <Link to="/dashboard" className="hover:text-violet-400">Dashboard</Link>
            <Link to="/incidents" className="hover:text-violet-400">Incidents</Link>
            <Link to="/risk" className="hover:text-violet-400">Risk</Link>
          </div>
        </nav>

        {/* ===== CONTENT ===== */}
        <main className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/risk" element={<Risk />} />
          </Routes>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="bg-black text-gray-400 text-center py-3 border-t border-violet-700">
          © {new Date().getFullYear()} <span className="text-violet-400">TrafficWiz</span> — Nashville Analytics
        </footer>
      </div>
    </Router>
  );
}

export default App;

