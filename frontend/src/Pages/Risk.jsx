/**
 * ============================================================
 * TrafficWiz - Risk Analysis & ML Dashboard
 * ============================================================
 * Purpose: Comprehensive risk visualization and ML model insights
 * 
 * Features:
 * - Severity distribution pie chart (Recharts)
 * - Machine Learning model performance metrics
 * - Live traffic volume prediction demo
 * - Model training statistics and feature importance
 * - Interactive prediction calculator
 * 
 * Data Sources:
 * - /api/incidents/by-severity - Severity distribution
 * - /metrics - ML model training metrics
 * - /predict - Live prediction endpoint
 * 
 * ML Metrics Displayed:
 * - R² Score (model accuracy)
 * - Mean Absolute Error (prediction error)
 * - Training/Test split sizes
 * - Feature list and target variable
 * ============================================================
 */

import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import { getHereIncidents } from "../api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Risk() {
  const [risk, setRisk] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [roadAnalysis, setRoadAnalysis] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionInput, setPredictionInput] = useState({
    accidents: 2,
    avg_speed: 50
  });
  const [loading, setLoading] = useState(false);

  const COLORS = ["#9333EA", "#A855F7", "#C084FC", "#D8B4FE"]; // purple tones

  useEffect(() => {
    async function fetchData() {
      // Fetch severity data - try HERE API first, fallback to database
      try {
        let severityData = [];
        
        try {
          // Try HERE API first
          const data = await getHereIncidents({
            lat: 36.1627,
            lng: -86.7816,
            radius: 25000
          });
          
          const incidents = data.incidents || [];
          
          if (incidents.length > 0) {
            // Calculate severity distribution from HERE data
            const severityCounts = {
              'Critical': incidents.filter(i => i.severity === 4).length,
              'Major': incidents.filter(i => i.severity === 3).length,
              'Minor': incidents.filter(i => i.severity === 2).length,
              'Low': incidents.filter(i => i.severity === 1).length
            };
            
            severityData = Object.entries(severityCounts)
              .filter(([_, count]) => count > 0)
              .map(([severity, count]) => ({
                severity,
                count
              }));
          }
        } catch (hereError) {
          console.warn("HERE API unavailable, using database fallback:", hereError);
        }
        
        // If HERE API failed or returned no data, use database fallback
        if (severityData.length === 0) {
          const res = await fetch(`${API_BASE}/api/incidents/by-severity`);
          const data = await res.json();
          severityData = data.by_severity || [];
        }
        
        setRisk(severityData);
      } catch (error) {
        console.error("Error fetching severity data:", error);
        // Set empty data to prevent crashes
        setRisk([]);
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
          // Set first road as selected if data exists
          if (roadData && typeof roadData === 'object' && Object.keys(roadData).length > 0) {
            setSelectedRoad(Object.keys(roadData)[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching road analysis:", error);
      }
    }
    fetchData();
  }, []);

  const handlePrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionInput)
      });
      const data = await res.json();
      setPrediction(data.prediction);
    } catch (error) {
      console.error("Error getting prediction:", error);
      setPrediction("Error");
    } finally {
      setLoading(false);
    }
  };

  const getR2Color = (r2) => {
    if (r2 >= 0.8) return "text-green-400";
    if (r2 >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  const getR2Label = (r2) => {
    if (r2 >= 0.8) return "Excellent";
    if (r2 >= 0.5) return "Good";
    if (r2 >= 0) return "Fair";
    return "Needs Improvement";
  };

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
      <h2 className="text-3xl font-bold mb-6 text-violet-300">Risk Analysis & ML Dashboard</h2>

      {/* Severity Distribution Chart */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-violet-200">Incident Severity Distribution</h3>
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

      {/* Machine Learning Metrics */}
      {metrics && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-violet-200">Machine Learning Model Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Accuracy Score Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-violet-200">Accuracy Score</h4>
                <span className="text-xs px-2 py-1 bg-violet-600/30 rounded-full">
                  {getR2Label(metrics.accuracy)}
                </span>
              </div>
              <p className={`text-3xl font-bold ${getR2Color(metrics.accuracy)}`}>
                {(metrics.accuracy * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Model accuracy (0 to 1.0, higher is better)
              </p>
            </div>

            {/* F1 Score Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-violet-200">F1 Score</h4>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {(metrics.f1_score * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Harmonic mean of precision & recall
              </p>
            </div>

            {/* Precision Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Precision</h4>
              <p className="text-3xl font-bold text-purple-400">
                {(metrics.precision * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Correct positive predictions
              </p>
            </div>

            {/* Recall Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Recall</h4>
              <p className="text-3xl font-bold text-pink-400">
                {(metrics.recall * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Actual positives found
              </p>
            </div>

            {/* Dataset Size Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-2">Dataset Split</h4>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-violet-300">
                  {metrics.n_train}
                </p>
                <span className="text-gray-400">/</span>
                <p className="text-2xl font-semibold text-violet-400">
                  {metrics.n_test}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Training / Test samples
              </p>
            </div>

            {/* Features Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30 md:col-span-2">
              <h4 className="text-sm font-medium text-violet-200 mb-3">Input Features</h4>
              <div className="flex flex-wrap gap-2">
                {metrics.features.map((feature, idx) => (
                  <span key={idx} className="px-3 py-1 bg-violet-600/40 rounded-full text-sm border border-violet-400/30">
                    {feature}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Target: <span className="text-violet-300 font-semibold">{metrics.target}</span>
              </p>
            </div>

            {/* Model Info Card */}
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h4 className="text-sm font-medium text-violet-200 mb-3">Model Type</h4>
              <p className="text-lg font-semibold text-violet-300">Random Forest</p>
              <p className="text-xs text-gray-400 mt-2">
                Ensemble learning algorithm
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* No Road Analysis Warning */}
      {!roadAnalysis && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-8">
          <p className="text-yellow-300">
            ⚠️ Road analysis not available. Run <code className="px-2 py-1 bg-gray-800 rounded">python backend/ml/train_model.py</code> to analyze traffic patterns.
          </p>
        </div>
      )}

      {/* Live Prediction Demo */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-violet-200">Traffic Volume Predictor</h3>
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
          <p className="text-gray-300 mb-4">
            Enter values to predict traffic volume using our ML model:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Accidents Input */}
            <div>
              <label className="block text-sm font-medium text-violet-200 mb-2">
                Number of Accidents
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={predictionInput.accidents}
                onChange={(e) => setPredictionInput({...predictionInput, accidents: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* Avg Speed Input */}
            <div>
              <label className="block text-sm font-medium text-violet-200 mb-2">
                Average Speed (mph)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={predictionInput.avg_speed}
                onChange={(e) => setPredictionInput({...predictionInput, avg_speed: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <button
            onClick={handlePrediction}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Predicting..." : "🔮 Get Prediction"}
          </button>

          {prediction !== null && (
            <div className="mt-6 p-4 bg-violet-900/40 border border-violet-500/50 rounded-lg">
              <p className="text-sm text-violet-200 mb-1">Predicted Traffic Volume:</p>
              <p className="text-3xl font-bold text-violet-300">
                {typeof prediction === 'number' ? prediction.toFixed(0) : prediction} 
                {typeof prediction === 'number' && <span className="text-lg text-gray-400 ml-2">vehicles</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* No Metrics Warning */}
      {!metrics && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <p className="text-yellow-300">
            ⚠️ ML model metrics not available. Run <code className="px-2 py-1 bg-gray-800 rounded">python backend/ml/train_model.py</code> to train the model.
          </p>
        </div>
      )}
    </div>
  );
}

export default Risk;
