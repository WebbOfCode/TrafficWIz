/**
 * ============================================================
 * TrafficWiz - Incidents List Page Component
 * ============================================================
 * Purpose: Searchable list of all traffic incidents
 * 
 * Features:
 * - Real-time search/filter by description or location
 * - Clickable incident cards (navigate to detail view)
 * - Severity badge color-coding (High/Medium/Low)
 * - Date display with formatted timestamps
 * - Empty state message when no incidents match search
 * 
 * Data Flow:
 * - Fetches all incidents from API_BASE/api/traffic
 * - Client-side filtering based on search query
 * - Links to /incidents/:id for detailed view
 * 
 * User Interaction:
 * - Search bar filters incidents in real-time
 * - Click any incident card to view full details
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";

function Incidents() {
  const [traffic, setTraffic] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchTraffic() {
      const res = await fetch(`${API_BASE}/api/traffic`);
      const data = await res.json();
      setTraffic(data.traffic_data || []);
    }
    fetchTraffic();
  }, []);

  const filtered = traffic.filter((i) =>
    i.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 text-white">
      <h2 className="text-3xl font-bold mb-4 text-violet-300">All Incidents</h2>

      <input
        type="text"
        placeholder="Search by location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border border-violet-700 bg-black/60 text-white rounded px-3 py-2 mb-4 w-full"
      />

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((i) => (
            <Link
              key={i.id}
              to={`/incidents/${i.id}`}
              className="card p-4 hover:bg-violet-900/40 transition block"
            >
              <div className="flex justify-between">
                <span className="font-semibold">{i.location}</span>
                <span
                  className={`font-bold ${
                    i.severity === "High"
                      ? "text-red-400"
                      : i.severity === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {i.severity}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1 truncate">{i.description}</p>
              <div className="text-xs text-gray-400 mt-2">Click for details →</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No incidents found.</p>
      )}
    </div>
  );
}

export default Incidents;
