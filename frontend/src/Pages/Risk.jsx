/**
 * ============================================================
 * TrafficWiz - Risk Analysis & Travel Time Recommendations
 * ============================================================
 * Purpose: ML-powered best/worst travel time predictions by road
 * 
 * Features:
 * - Severity distribution pie chart
 * - ML model performance metrics
 * - Best/worst travel times for each Nashville road
 * - Road-specific safety recommendations
 * - Interactive road selector
 * 
 * Data Sources:
 * - /api/incidents/by-severity - Severity distribution
 * - /metrics - ML model training metrics
 * - /road-analysis - Best/worst times per road
 * 
 * ML Analysis:
 * - Analyzes historical incident patterns
 * - Identifies safest hours and days for each road
 * - Provides risk scores based on time/location
 * ============================================================
 */

import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function Risk() {
  const [risk, setRisk] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [roadAnalysis, setRoadAnalysis] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);

  const COLORS = ["#9333EA", "#A855F7", "#C084FC"]; // purple tones

  useEffect(() => {
    async function fetchData() {
      // Fetch severity data
      try {
        const res = await fetch(`${API_BASE}/api/incidents/by-severity`);
        const data = await res.json();
        setRisk(data.by_severity || []);
      } catch (error) {
        console.error("Error fetching severity data:", error);
      }

      // Fetch ML metrics
      try {
        const metricsRes = await fetch(`${API_BASE}/metrics`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }

      // Fetch road analysis
      try {
        const roadRes = await fetch(`${API_BASE}/road-analysis`);
        if (roadRes.ok) {
          const roadData = await roadRes.json();
          setRoadAnalysis(roadData);
          // Set first road as selected
          if (Object.keys(roadData).length > 0) {
            setSelectedRoad(Object.keys(roadData)[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching road analysis:", error);
      }
    }
    fetchData();
  }, []);

  const formatHour = (hour) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:00 ${ampm}`;
  };

  const getRiskColor = (avgSeverity) => {
    if (avgSeverity >= 2.5) return "text-red-400";
    if (avgSeverity >= 1.5) return "text-yellow-400";
    return "text-green-400";
  };

  const getRiskLabel = (avgSeverity) => {
    if (avgSeverity >= 2.5) return "High Risk";
    if (avgSeverity >= 1.5) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="p-6 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-violet-300">Traffic Risk Analysis & Travel Recommendations</h2>

      {/* ML Model Performance */}
      {metrics && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-violet-200">ML Model Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Accuracy Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Model Accuracy</h4>
              <p className="text-3xl font-bold text-green-400">
                {(metrics.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Predicts incident severity based on time/location
              </p>
            </div>

            {/* Dataset Size */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Training Data</h4>
              <p className="text-3xl font-bold text-violet-300">
                {metrics.n_train + metrics.n_test}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Total incidents analyzed
              </p>
            </div>

            {/* Model Type */}
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

      {/* Severity Distribution Chart */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-violet-200">Overall Incident Severity</h3>
        {risk.length > 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
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
          <p className="text-gray-400">No severity data available.</p>
        )}
      </div>

      {/* Road Analysis - Best/Worst Times */}
      {roadAnalysis && Object.keys(roadAnalysis).length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-violet-200">🚗 Best & Worst Travel Times by Road</h3>
          
          {/* Road Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-violet-200 mb-2">Select Road:</label>
            <select
              value={selectedRoad || ''}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white focus:outline-none focus:border-violet-400"
            >
              {Object.keys(roadAnalysis).map(road => (
                <option key={road} value={road}>{road}</option>
              ))}
            </select>
          </div>

          {/* Selected Road Details */}
          {selectedRoad && roadAnalysis[selectedRoad] && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Road Stats Card */}
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
                <h4 className="text-xl font-semibold text-violet-300 mb-4">{selectedRoad}</h4>
                
                <div className="space-y-4">
                  {/* Total Incidents */}
                  <div>
                    <p className="text-sm text-gray-400">Total Incidents</p>
                    <p className="text-2xl font-bold text-white">{roadAnalysis[selectedRoad].total_incidents}</p>
                  </div>

                  {/* Average Risk */}
                  <div>
                    <p className="text-sm text-gray-400">Average Risk Level</p>
                    <p className={`text-2xl font-bold ${getRiskColor(roadAnalysis[selectedRoad].avg_severity)}`}>
                      {getRiskLabel(roadAnalysis[selectedRoad].avg_severity)}
                    </p>
                  </div>

                  {/* Rush Hour Impact */}
                  <div>
                    <p className="text-sm text-gray-400">Rush Hour Incidents</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {roadAnalysis[selectedRoad].rush_hour_incidents}
                    </p>
                  </div>

                  {/* Weekend Impact */}
                  <div>
                    <p className="text-sm text-gray-400">Weekend Incidents</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {roadAnalysis[selectedRoad].weekend_incidents}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
                <h4 className="text-xl font-semibold text-violet-300 mb-4">Travel Recommendations</h4>
                
                {/* Best Times */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">✅</span>
                    <h5 className="text-lg font-semibold text-green-400">Best Times to Travel</h5>
                  </div>
                  <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {roadAnalysis[selectedRoad].best_hours.map(hour => (
                        <span key={hour} className="px-3 py-1 bg-green-600/40 rounded-full text-sm border border-green-400/30">
                          {formatHour(hour)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-green-300">
                      Safest day: <span className="font-semibold">{roadAnalysis[selectedRoad].best_day}</span>
                    </p>
                  </div>
                </div>

                {/* Worst Times */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚠️</span>
                    <h5 className="text-lg font-semibold text-red-400">Avoid These Times</h5>
                  </div>
                  <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {roadAnalysis[selectedRoad].worst_hours.map(hour => (
                        <span key={hour} className="px-3 py-1 bg-red-600/40 rounded-full text-sm border border-red-400/30">
                          {formatHour(hour)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-red-300">
                      Riskiest day: <span className="font-semibold">{roadAnalysis[selectedRoad].worst_day}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Dangerous Roads Summary */}
          <div className="mt-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
            <h4 className="text-xl font-semibold text-violet-300 mb-4">🚨 Most Dangerous Roads</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(roadAnalysis).slice(0, 3).map(([road, data], idx) => (
                <div key={road} className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-red-400">#{idx + 1}</span>
                    <h5 className="text-sm font-semibold text-white truncate">{road}</h5>
                  </div>
                  <p className="text-2xl font-bold text-red-300">{data.total_incidents}</p>
                  <p className="text-xs text-gray-400">incidents</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data Warning */}
      {!roadAnalysis && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <p className="text-yellow-300">
            ⚠️ Road analysis not available. Run <code className="px-2 py-1 bg-gray-800 rounded">python backend/ml/train_model.py</code> to analyze traffic patterns.
          </p>
        </div>
      )}
    </div>
  );
}

export default Risk;
