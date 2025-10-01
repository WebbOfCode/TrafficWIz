import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function Dashboard() {
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    async function fetchTraffic() {
      const response = await fetch(`${API_BASE}/api/traffic`);
      const data = await response.json();
      setTraffic(data.traffic_data || []);
    }
    fetchTraffic();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      {traffic.length === 0 ? <p>No incidents found.</p> : (
        <ul>
          {traffic.map(t => (
            <li key={t.id}>
              {t.location} — {t.severity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
