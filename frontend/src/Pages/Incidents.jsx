import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function Incidents() {
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    async function fetchTraffic() {
      const response = await fetch(`${API_BASE}/api/traffic`); // ✅ use config.js
      const data = await response.json();
      setTraffic(data.traffic_data || []);
    }
    fetchTraffic();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">All Incidents</h2>
      {traffic.length > 0 ? (
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th>Date</th><th>Location</th><th>Severity</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {traffic.map((t) => (
              <tr key={t.id}>
                <td>{t.date ? new Date(t.date).toLocaleDateString() : "Unknown"}</td>
                <td>{t.location}</td>
                <td>{t.severity}</td>
                <td>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No incidents found.</p>
      )}
    </div>
  );
}

export default Incidents;
