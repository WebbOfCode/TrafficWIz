// Incidents page - searchable list of all traffic incidents

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTraffic } from "../api";

function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const data = await getTraffic();
        setIncidents(data || []);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIncidents();
    
    // Refresh every 2 minutes
    const refreshInterval = setInterval(fetchIncidents, 120000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Filter incidents by search query
  const filteredIncidents = incidents.filter((incident) =>
    (incident.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (incident.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (incident.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 text-white">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-violet-300">All Incidents</h2>
        <p className="text-sm text-gray-400 mt-1">
          Traffic incident data from Nashville database • {incidents.length} incidents
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border border-violet-700 bg-black/60 text-white rounded px-3 py-2 mb-4 w-full"
      />

      {filteredIncidents.length > 0 ? (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="card p-4 hover:bg-violet-900/40 transition block"
            >
              <div className="flex justify-between">
                <span className="font-semibold">{incident.location}</span>
                <span
                  className={`font-bold ${
                    incident.severity === "High"
                      ? "text-red-400"
                      : incident.severity === "Medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1 truncate">{incident.description}</p>
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
