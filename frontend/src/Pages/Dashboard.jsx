// Dashboard page - shows incident summary cards and filterable/sortable table

import { useEffect, useState } from "react";
import { getTraffic } from "../api";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date_desc");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    async function fetchTrafficData() {
      try {
        const data = await getTraffic();
        console.debug("Dashboard fetched traffic incidents =>", data);
        setTraffic(data || []);
      } catch (error) {
        console.error("Error fetching traffic:", error);
        setTraffic([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrafficData();
    
    // Refresh every 2 minutes
    const refreshInterval = setInterval(fetchTrafficData, 120000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Count incidents by severity
  const highCount = traffic.filter((t) => t.severity === "High").length;
  const mediumCount = traffic.filter((t) => t.severity === "Medium").length;
  const lowCount = traffic.filter((t) => t.severity === "Low").length;

  // Helper to convert severity string to numeric rank for sorting
  const getSeverityRank = (severity) => {
    if (!severity) return 0;
    const normalized = String(severity).trim().toLowerCase();
    if (normalized === "high") return 3;
    if (normalized === "medium") return 2;
    if (normalized === "low") return 1;
    
    // Handle numeric severity values
    const numericValue = Number(severity);
    if (!isNaN(numericValue)) return numericValue;
    return 0;
  };

  // Apply severity filter
  const filteredIncidents = severityFilter === "all" 
    ? traffic 
    : traffic.filter(t => String(t.severity || "").toLowerCase() === severityFilter);

  // Apply sorting
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (sortBy === "date_desc") {
      return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    }
    if (sortBy === "date_asc") {
      return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0);
    }
    if (sortBy === "severity_desc") {
      return getSeverityRank(b.severity) - getSeverityRank(a.severity);
    }
    if (sortBy === "severity_asc") {
      return getSeverityRank(a.severity) - getSeverityRank(b.severity);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-red-500 p-4">
          <h3 className="text-lg font-semibold text-gray-300">High Severity</h3>
          <p className="text-3xl font-bold text-red-400">{highCount}</p>
        </div>
        <div className="card border-l-4 border-yellow-400 p-4">
          <h3 className="text-lg font-semibold text-gray-300">Medium Severity</h3>
          <p className="text-3xl font-bold text-yellow-400">{mediumCount}</p>
        </div>
        <div className="card border-l-4 border-green-400 p-4">
          <h3 className="text-lg font-semibold text-gray-300">Low Severity</h3>
          <p className="text-3xl font-bold text-green-400">{lowCount}</p>
        </div>
      </div>

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
      ) : sortedIncidents.length > 0 ? (
        <div className="overflow-x-auto card">
          <table className="min-w-full border border-violet-700">
            <thead className="bg-black/40">
              <tr>
                <th className="px-4 py-2 border border-violet-700">Date</th>
                <th className="px-4 py-2 border border-violet-700">Location</th>
                <th className="px-4 py-2 border border-violet-700">Severity</th>
                <th className="px-4 py-2 border border-violet-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-violet-900/40">
                  <td className="border border-violet-800 px-3 py-2">
                    {incident.date ? new Date(incident.date).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="border border-violet-800 px-3 py-2">
                    {incident.location || "Unknown"}
                  </td>
                  <td
                    className={`border border-violet-800 px-3 py-2 font-semibold ${
                      incident.severity === "High"
                        ? "text-red-400"
                        : incident.severity === "Medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {incident.severity || "N/A"}
                  </td>
                  <td className="border border-violet-800 px-3 py-2 text-gray-300">
                    {incident.description || "—"}
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
