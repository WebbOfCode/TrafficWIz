import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      try {
        const response = await fetch(`${API_BASE}/api/traffic`);  // ✅ use config.js
        const data = await response.json();
        setTraffic(data.traffic_data || []);
      } catch (err) {
        console.error("Error fetching traffic:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTraffic();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      {loading && <p>Loading...</p>}
      {traffic.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Location</th>
                <th className="px-4 py-2 border">Severity</th>
                <th className="px-4 py-2 border">Description</th>
              </tr>
            </thead>
            <tbody>
              {traffic.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td>{t.date ? new Date(t.date).toLocaleDateString() : "Unknown"}</td>
                  <td>{t.location}</td>
                  <td className={
                    t.severity === "High"
                      ? "text-red-600"
                      : t.severity === "Medium"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }>
                    {t.severity}
                  </td>
                  <td>{t.description || "No details"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p>No data available</p>
      )}
    </div>
  );
}

export default Dashboard;
