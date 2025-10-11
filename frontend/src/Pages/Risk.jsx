import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Risk() {
  const [risk, setRisk] = useState([]);
  const COLORS = ["#9333EA", "#A855F7", "#C084FC"]; // purple tones

  useEffect(() => {
    async function fetchRisk() {
      const res = await fetch(`${API_BASE}/api/incidents/by-severity`);
      const data = await res.json();
      setRisk(data.by_severity || []);
    }
    fetchRisk();
  }, []);

  return (
    <div className="p-6 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-violet-300">Risk Analysis</h2>

      {risk.length > 0 ? (
        <div className="card p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={risk}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {risk.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1F1F1F", border: "1px solid #9333EA", color: "#FFF" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-400">No data available.</p>
      )}
    </div>
  );
}

export default Risk;
