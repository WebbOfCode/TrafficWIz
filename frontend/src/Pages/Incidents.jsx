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
import { getTraffic } from "../api";

function Incidents() {
  const [traffic, setTraffic] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      try {
        // Fetch traffic incidents from database (populated by HERE API)
        const data = await getTraffic();
        
        setTraffic(data || []);
      } catch (err) {
        console.error('Error fetching incidents:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTraffic();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchTraffic, 120000);
    return () => clearInterval(interval);
  }, []);

  const filtered = traffic.filter((i) =>
    (i.location?.toLowerCase() || '').includes(query.toLowerCase()) ||
    (i.description?.toLowerCase() || '').includes(query.toLowerCase()) ||
    (i.type?.toLowerCase() || '').includes(query.toLowerCase())
  );

  return (
    <div className="p-4 text-white">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-violet-300">All Incidents</h2>
        <p className="text-sm text-gray-400 mt-1">
          Traffic incident data from Nashville database • {traffic.length} incidents
        </p>
      </div>

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
