import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function Risk() {
  const [severityStats, setSeverityStats] = useState([]);

  useEffect(() => {
    async function fetchSeverity() {
      const response = await fetch(`${API_BASE}/api/incidents/by-severity`); // ✅ use config.js
      const data = await response.json();
      setSeverityStats(data.by_severity || []);
    }
    fetchSeverity();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Risk Analysis</h2>
      {severityStats.length > 0 ? (
        <ul>
          {severityStats.map((s, i) => (
            <li key={i} className="flex justify-between p-2 bg-white shadow">
              <span>{s.severity}</span>
              <span>{s.count} incidents</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No risk data available.</p>
      )}
    </div>
  );
}

export default Risk;
