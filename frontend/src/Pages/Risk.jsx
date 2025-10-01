import { useEffect, useState } from "react";

function Risk() {
  const [severityStats, setSeverityStats] = useState([]);

  useEffect(() => {
    async function fetchSeverity() {
      const response = await fetch("http://127.0.0.1:8000/api/incidents/by-severity");
      const data = await response.json();
      setSeverityStats(data.by_severity || []);
    }
    fetchSeverity();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Risk Analysis</h2>

      {severityStats.length > 0 ? (
        <ul className="space-y-2">
          {severityStats.map((s, i) => (
            <li key={i} className="p-4 bg-white rounded-lg shadow flex justify-between">
              <span className="font-semibold">{s.severity}</span>
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
