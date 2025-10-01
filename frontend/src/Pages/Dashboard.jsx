import { useEffect, useState } from "react";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      const response = await fetch("http://127.0.0.1:8000/api/traffic");
      const data = await response.json();
      setTraffic(data.traffic_data || []);
      setLoading(false);
    }
    fetchTraffic();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

      {loading && <p>Loading...</p>}

      {traffic.length > 0 && (
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
                  <td className="px-4 py-2 border">
                    {t.date ? new Date(t.date).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-4 py-2 border">{t.location}</td>
                  <td
                    className={`px-4 py-2 border font-semibold ${
                      t.severity === "High"
                        ? "text-red-600"
                        : t.severity === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {t.severity}
                  </td>
                  <td className="px-4 py-2 border">
                    {t.description || "No details"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
