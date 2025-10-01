import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function Risk() {
  const [risk, setRisk] = useState([]);

  useEffect(() => {
    async function fetchRisk() {
      const response = await fetch(`${API_BASE}/api/incidents/by-severity`);
      const data = await response.json();
      setRisk(data.by_severity || []);
    }
    fetchRisk();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Risk Analysis</h2>
      {risk.length === 0 ? <p>No data</p> : (
        <ul>
          {risk.map((r, i) => (
            <li key={i}>
              {r.severity}: {r.count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Risk;
