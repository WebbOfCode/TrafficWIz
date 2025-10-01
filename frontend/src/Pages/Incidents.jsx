import { useEffect, useState } from "react";

function Incidents() {
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    async function fetchTraffic() {
      const response = await fetch("http://127.0.0.1:8000/api/traffic");
      const data = await response.json();
      setTraffic(data.traffic_data || []);
    }
    fetchTraffic();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">All Incidents</h2>

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
                  <td className="px-4 py-2 border">
                    {t.date ? new Date(t.date).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-4 py-2 border">{t.location}</td>
                  <td className="px-4 py-2 border">{t.severity}</td>
                  <td className="px-4 py-2 border">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No incidents found.</p>
      )}
    </div>
  );
}

export default Incidents;
