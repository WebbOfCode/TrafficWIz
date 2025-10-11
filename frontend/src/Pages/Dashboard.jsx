import { useEffect, useState } from "react";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      try {
        // ✅ Use relative URL so Vite proxy forwards to Flask backend
        const res = await fetch("/api/traffic");

        // ✅ Throw error if response not OK
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        // ✅ Parse and safely update state
        const data = await res.json();
        setTraffic(data.traffic_data || []);
      } catch (err) {
        console.error("Error fetching traffic:", err);
        setTraffic([]); // Prevent stale UI
      } finally {
        setLoading(false);
      }
    }

    fetchTraffic();
  }, []);

  const high = traffic.filter((t) => t.severity === "High").length;
  const med = traffic.filter((t) => t.severity === "Medium").length;
  const low = traffic.filter((t) => t.severity === "Low").length;

  return (
    <div className="p-4 text-white">
      <h2 className="text-3xl font-bold mb-6 text-violet-300">
        Dashboard Overview
      </h2>

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

      {/* ===== Table ===== */}
      {loading ? (
        <p className="text-gray-400">Loading traffic data...</p>
      ) : traffic.length > 0 ? (
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
              {traffic.map((t) => (
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
        <p className="text-gray-400">No data available.</p>
      )}
    </div>
  );
}

export default Dashboard;
