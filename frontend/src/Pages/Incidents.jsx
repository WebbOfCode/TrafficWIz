import { useEffect, useState } from "react";
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
            <div
              key={i.id}
              className="card p-4 hover:bg-violet-900/40 transition"
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
              <p className="text-sm text-gray-300 mt-1">{i.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No incidents found.</p>
      )}
    </div>
  );
}

export default Incidents;
