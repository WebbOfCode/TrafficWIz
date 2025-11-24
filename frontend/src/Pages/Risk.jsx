// Risk analysis page - shows ML predictions, incident patterns, and travel recommendations

import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Risk() {
  const [severityData, setSeverityData] = useState([]);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [roadAnalysis, setRoadAnalysis] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);

  const CHART_COLORS = ["#9333EA", "#A855F7", "#C084FC"];

  useEffect(() => {
    async function fetchAnalysisData() {
      // Fetch incident severity distribution
      try {
        const severityResponse = await fetch(`${API_BASE}/api/incidents/by-severity`);
        const severityJson = await severityResponse.json();
        setSeverityData(severityJson.by_severity || []);
      } catch (error) {
        console.error("Error fetching severity data:", error);
      }

      // Fetch ML model performance metrics
      try {
        const metricsResponse = await fetch(`${API_BASE}/metrics`);
        if (metricsResponse.ok) {
          const metricsJson = await metricsResponse.json();
          setMlMetrics(metricsJson);
        }
      } catch (error) {
        console.error("Error fetching ML metrics:", error);
      }

      // Fetch road-by-road analysis
      try {
        const roadResponse = await fetch(`${API_BASE}/road-analysis`);
        if (roadResponse.ok) {
          const roadJson = await roadResponse.json();
          setRoadAnalysis(roadJson);
          
          // Select first road by default
          const roadNames = Object.keys(roadJson);
          if (roadNames.length > 0) {
            setSelectedRoad(roadNames[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching road analysis:", error);
      }
    }
    
    fetchAnalysisData();
  }, []);

  // Convert 24-hour time to readable format (e.g., "3:00 PM")
  const formatHour = (hour) => {
    const displayHour = hour % 12 || 12;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${period}`;
  };

  // Determine risk color based on average severity
  const getRiskColor = (avgSeverity) => {
    if (avgSeverity >= 2.5) return "text-red-400";
    if (avgSeverity >= 1.5) return "text-yellow-400";
    return "text-green-400";
  };

  // Convert numeric severity to readable label
  const getRiskLabel = (avgSeverity) => {
    if (avgSeverity >= 2.5) return "High Risk";
    if (avgSeverity >= 1.5) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="p-6 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-violet-300">Traffic Risk Analysis & Travel Recommendations</h2>

      {mlMetrics && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-violet-200">ML Model Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Model Accuracy</h4>
              <p className="text-3xl font-bold text-green-400">
                {(mlMetrics.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Predicts incident severity based on time/location
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Training Data</h4>
              <p className="text-3xl font-bold text-violet-300">
                {mlMetrics.n_train + mlMetrics.n_test}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Total incidents analyzed
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Algorithm</h4>
              <p className="text-lg font-semibold text-violet-300">Random Forest</p>
              <p className="text-xs text-gray-400 mt-2">
                Time-of-day pattern recognition
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-violet-200">Overall Incident Severity</h3>
        {severityData.length > 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1F1F1F", border: "1px solid #9333EA", color: "#FFF" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-400">No severity data available.</p>
        )}
      </div>

      {roadAnalysis && Object.keys(roadAnalysis).length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-violet-200">Best & Worst Travel Times by Road</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-violet-200 mb-2">Select Road:</label>
            <select
              value={selectedRoad || ''}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white focus:outline-none focus:border-violet-400"
            >
              {Object.keys(roadAnalysis).map(roadName => (
                <option key={roadName} value={roadName}>{roadName}</option>
              ))}
            </select>
          </div>

          {selectedRoad && roadAnalysis[selectedRoad] ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
                <h4 className="text-xl font-semibold text-violet-300 mb-4">{selectedRoad}</h4>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Incidents</p>
                    <p className="text-2xl font-bold text-white">
                      {roadAnalysis[selectedRoad].total_incidents || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Average Risk Level</p>
                    <p className={`text-2xl font-bold ${getRiskColor(roadAnalysis[selectedRoad].avg_severity || 0)}`}>
                      {getRiskLabel(roadAnalysis[selectedRoad].avg_severity || 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Rush Hour Incidents</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {roadAnalysis[selectedRoad].rush_hour_incidents || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Weekend Incidents</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {roadAnalysis[selectedRoad].weekend_incidents || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
                <h4 className="text-xl font-semibold text-violet-300 mb-4">Travel Recommendations</h4>
                
                {roadAnalysis[selectedRoad].best_hours && roadAnalysis[selectedRoad].best_hours.length > 0 ? (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-green-400 mb-3">Best Times to Travel</h5>
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {roadAnalysis[selectedRoad].best_hours.map(hour => (
                          <span key={hour} className="px-3 py-1 bg-green-600/40 rounded-full text-sm border border-green-400/30">
                            {formatHour(hour)}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-green-300">
                        Safest day: <span className="font-semibold">{roadAnalysis[selectedRoad].best_day || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 text-gray-400 text-sm">No data available for best travel times yet.</div>
                )}

                {roadAnalysis[selectedRoad].worst_hours && roadAnalysis[selectedRoad].worst_hours.length > 0 ? (
                  <div>
                    <h5 className="text-lg font-semibold text-red-400 mb-3">Avoid These Times</h5>
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {roadAnalysis[selectedRoad].worst_hours.map(hour => (
                          <span key={hour} className="px-3 py-1 bg-red-600/40 rounded-full text-sm border border-red-400/30">
                            {formatHour(hour)}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-red-300">
                        Riskiest day: <span className="font-semibold">{roadAnalysis[selectedRoad].worst_day || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No data available for times to avoid yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
              <p className="text-yellow-300">No data available for the selected road.</p>
            </div>
          )}

          <div className="mt-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
            <h4 className="text-xl font-semibold text-violet-300 mb-4">Most Dangerous Roads</h4>
            <p className="text-sm text-gray-400 mb-4">Ranked by risk score (incident count × average severity)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(roadAnalysis)
                .sort((a, b) => (b[1].risk_score || 0) - (a[1].risk_score || 0))
                .slice(0, 3)
                .map(([roadName, roadData], index) => (
                  <div key={roadName} className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 hover:bg-red-900/30 transition-colors cursor-pointer"
                       onClick={() => setSelectedRoad(roadName)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-red-400">#{index + 1}</span>
                      <h5 className="text-sm font-semibold text-white line-clamp-2">{roadName}</h5>
                    </div>
                    <p className="text-2xl font-bold text-red-300">{roadData.total_incidents}</p>
                    <p className="text-xs text-gray-400">incidents</p>
                    {roadData.risk_score && (
                      <p className="text-xs text-red-400 mt-1">Risk: {roadData.risk_score.toFixed(1)}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {!roadAnalysis && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <p className="text-yellow-300">
            Road analysis not available. Run <code className="px-2 py-1 bg-gray-800 rounded">python backend/ml/train_model.py</code> to analyze traffic patterns.
          </p>
        </div>
      )}
    </div>
  );
}

export default Risk;
