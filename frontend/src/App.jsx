import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Risk from "./pages/Risk";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
	    <img src="/trafficwiz-logo.png" alt="TrafficWiz Logo" className="w-40 mb-6" />
            <span className="text-xl font-bold">TrafficWiz</span>
          </div>
          <div className="space-x-6">
            <Link to="/" className="hover:text-gray-300">Home</Link>
            <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            <Link to="/incidents" className="hover:text-gray-300">Incidents</Link>
            <Link to="/risk" className="hover:text-gray-300">Risk</Link>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/risk" element={<Risk />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white text-center py-3">
          © {new Date().getFullYear()} TrafficWiz. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
