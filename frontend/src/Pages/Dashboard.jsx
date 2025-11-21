/**
 * ============================================================
 * TrafficWiz - Dashboard Page Component
 * ============================================================
 * Purpose: Main dashboard view with incident summary and detailed table
 * 
 * Features:
 * - Summary cards showing total incidents and severity breakdown
 * - Sortable incident table with multiple sort options:
 *   - Date: Recent first / Oldest first
 *   - Severity: High to Low / Low to High
 * - Severity filter dropdown (All / High / Medium / Low)
 * - Debug panel showing raw API response (for development)
 * - Response shape normalization (handles multiple backend formats)
 * 
 * Data Flow:
 * - Fetches from /api/traffic (proxied by Vite dev server)
 * - Normalizes severity values (case-insensitive, numeric mapping)
 * - Applies filtering and sorting before rendering
 * 
 * State Management:
 * - traffic: Raw incident data from API
 * - sortBy: Current sort option (date_desc, date_asc, severity_desc, severity_asc)
 * - severityFilter: Active severity filter ("all", "high", "medium", "low")
 * - loading: Loading state for async data fetch
 * ============================================================
 */

import { useEffect, useState } from "react";
import { getTraffic } from "../api";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date_desc");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    async function fetchTraffic() {
      try {
        // ✅ Fetch traffic incidents from database
        const data = await getTraffic();

        console.debug("Dashboard fetched traffic incidents =>", data);
        
        // Data is already in correct format from backend
        setTraffic(data || []);
      } catch (err) {
        console.error("Error fetching traffic:", err);
        setTraffic([]); // Prevent stale UI
      } finally {
        setLoading(false);
      }
    }

    fetchTraffic();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchTraffic, 120000);
    return () => clearInterval(interval);
  }, []);

  const high = traffic.filter((t) => t.severity === "High").length;
  const med = traffic.filter((t) => t.severity === "Medium").length;
  const low = traffic.filter((t) => t.severity === "Low").length;

  // Derived filtered + sorted rows based on sortBy and severityFilter
  const severityRank = (s) => {
    if (!s) return 0;
    const v = String(s).trim().toLowerCase();
    if (v === "high") return 3;
    if (v === "medium") return 2;
    if (v === "low") return 1;
    const n = Number(s);
    if (!isNaN(n)) return n;
    return 0;
  };

  const filtered = severityFilter === "all" ? traffic : traffic.filter(t => {
    return String(t.severity || "").toLowerCase() === severityFilter;
  });

  const displayRows = [...filtered].sort((a, b) => {
    if (sortBy === "date_desc") {
      return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    }
    if (sortBy === "date_asc") {
      return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0);
    }
    if (sortBy === "severity_desc") {
      return severityRank(b.severity) - severityRank(a.severity);
    }
    if (sortBy === "severity_asc") {
      return severityRank(a.severity) - severityRank(b.severity);
    }
    return 0;
  });

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-violet-300">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Traffic incident data from Nashville database
          </p>
        </div>
      </div>

      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-red-500 p-4">
          <h3 className="text-lg font-semibold text-gray-300">High Severity</h3>
          <p className="text-3xl font-bold text-red-400">{high}</p>
        </div>
        <div className="card border-l-4 border-yellow-400 p-4">
          <h3 className="text-lg font-semibold text-gray-300">
            Medium Severity
          </h3>
          <p className="text-3xl font-bold text-yellow-400">{med}</p>
        </div>
        <div className="card border-l-4 border-green-400 p-4">
          <h3 className="text-lg font-semibold text-gray-300">Low Severity</h3>
          <p className="text-3xl font-bold text-green-400">{low}</p>
        </div>
      </div>

      {/* ===== Table and Controls ===== */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-300">Showing {traffic.length} incidents</div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Filter severity:</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-black/60 text-white border border-violet-700 rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/60 text-white border border-violet-700 rounded px-2 py-1 text-sm"
              >
                <option value="date_desc">Date: Recent</option>
                <option value="date_asc">Date: Oldest</option>
                <option value="severity_desc">Severity (High → Low)</option>
                <option value="severity_asc">Severity (Low → High)</option>
              </select>
            </div>
          </div>
      </div>
      {loading ? (
        <p className="text-gray-400">Loading traffic data...</p>
      ) : displayRows.length > 0 ? (
        <div className="overflow-x-auto card">
          <table className="min-w-full border border-violet-700">
            <thead className="bg-black/40">
              <tr>
                <th className="px-4 py-2 border border-violet-700">Date</th>
                <th className="px-4 py-2 border border-violet-700">Location</th>
                <th className="px-4 py-2 border border-violet-700">Severity</th>
                <th className="px-4 py-2 border border-violet-700">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((t) => (
                <tr key={t.id} className="hover:bg-violet-900/40">
                  <td className="border border-violet-800 px-3 py-2">
                    {t.date ? new Date(t.date).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="border border-violet-800 px-3 py-2">
                    {t.location || "Unknown"}
                  </td>
                  <td
                    className={`border border-violet-800 px-3 py-2 font-semibold ${
                      t.severity === "High"
                        ? "text-red-400"
                        : t.severity === "Medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {t.severity || "N/A"}
                  </td>
                  <td className="border border-violet-800 px-3 py-2 text-gray-300">
                    {t.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <p className="text-gray-400">No data available.</p>
          <details className="mt-2 text-xs text-gray-300 bg-black/30 p-3 rounded">
            <summary className="cursor-pointer">Debug: show fetched traffic (raw)</summary>
            <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(traffic, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
