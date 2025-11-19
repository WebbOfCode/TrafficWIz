/**
 * ============================================================
 * TrafficWiz - TomTom Traffic Page
 * ============================================================
 * Purpose: Dedicated page for TomTom real-time traffic features
 * 
 * Features:
 * - Live traffic incidents from TomTom API
 * - Interactive map with traffic flow visualization
 * - Nashville traffic overview dashboard
 * - Route planning with traffic avoidance
 * - Location search and geocoding
 * 
 * Components:
 * - TomTomMap: Interactive map component
 * - Traffic incident cards with severity indicators
 * - Real-time traffic flow data display
 * - Route planner with start/end location input
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import TomTomMap from '../components/TomTomMap';
import { 
  getNashvilleTrafficOverview, 
  getTomTomIncidents, 
  calculateTomTomRoute,
  geocodeTomTom 
} from '../api';

const TomTomTraffic = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  
  // Route planning state
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  useEffect(() => {
    loadTrafficData();
  }, []);

  const loadTrafficData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, incidentsData] = await Promise.all([
        getNashvilleTrafficOverview().catch(err => ({ error: err.message })),
        getTomTomIncidents().catch(err => ({ incidents: [], error: err.message }))
      ]);
      
      setOverview(overviewData);
      setIncidents(incidentsData.incidents || []);
      
    } catch (err) {
      console.error('Error loading traffic data:', err);
      setError('Failed to load traffic data. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    // Could be used to show traffic flow for selected location
  };

  const geocodeAndSetCoords = async (address, isStart = true) => {
    try {
      const results = await geocodeTomTom(address);
      if (results.results && results.results.length > 0) {
        const coords = {
          lat: results.results[0].lat,
          lon: results.results[0].lon
        };
        
        if (isStart) {
          setStartCoords(coords);
        } else {
          setEndCoords(coords);
        }
        
        return coords;
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    }
    return null;
  };

  const planRoute = async () => {
    if (!startAddress || !endAddress) {
      alert('Please enter both start and end addresses');
      return;
    }

    try {
      setRouteLoading(true);
      
      // Geocode addresses if we don't have coordinates
      let start = startCoords;
      let end = endCoords;
      
      if (!start) {
        start = await geocodeAndSetCoords(startAddress, true);
      }
      if (!end) {
        end = await geocodeAndSetCoords(endAddress, false);
      }
      
      if (!start || !end) {
        throw new Error('Could not find one or both addresses');
      }

      const route = await calculateTomTomRoute(start, end, true);
      setRouteData(route);
      
    } catch (err) {
      console.error('Route planning failed:', err);
      alert('Route planning failed: ' + err.message);
    } finally {
      setRouteLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 0:
      case 1: return '#22c55e'; // Green - Low
      case 2:
      case 3: return '#f59e0b'; // Orange - Medium  
      case 4:
      case 5: return '#ef4444'; // Red - High
      default: return '#6b7280'; // Gray - Unknown
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 0:
      case 1: return 'Low';
      case 2:
      case 3: return 'Medium';
      case 4:
      case 5: return 'High';
      default: return 'Unknown';
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg text-gray-600">Loading TomTom traffic data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TomTom Live Traffic</h1>
              <p className="text-gray-600">Real-time traffic incidents and route planning</p>
            </div>
            <button
              onClick={loadTrafficData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="font-medium text-red-800">API Configuration Required</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Please add your TomTom API key to the configuration files.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Nashville Traffic Map</h2>
                <p className="text-sm text-gray-600">Interactive map with live incidents and traffic flow</p>
              </div>
              <div className="p-4">
                <TomTomMap
                  center={[36.1627, -86.7816]}
                  zoom={11}
                  showTraffic={true}
                  showIncidents={true}
                  height="500px"
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>

            {/* Route Planning */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Route Planner</h2>
                <p className="text-sm text-gray-600">Plan routes with real-time traffic avoidance</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Address
                    </label>
                    <input
                      type="text"
                      value={startAddress}
                      onChange={(e) => setStartAddress(e.target.value)}
                      placeholder="e.g., Downtown Nashville"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Address
                    </label>
                    <input
                      type="text"
                      value={endAddress}
                      onChange={(e) => setEndAddress(e.target.value)}
                      placeholder="e.g., Nashville Airport"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={planRoute}
                  disabled={routeLoading || !startAddress || !endAddress}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {routeLoading ? '🔄 Planning...' : '🚗 Plan Route'}
                </button>

                {routeData && !routeData.error && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Route Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Distance:</span>
                        <span className="ml-2 font-medium">{formatDistance(routeData.distance_meters)}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Travel Time:</span>
                        <span className="ml-2 font-medium">{formatDuration(routeData.travel_time_seconds)}</span>
                      </div>
                      {routeData.traffic_delay_seconds > 0 && (
                        <div className="col-span-2">
                          <span className="text-green-600">Traffic Delay:</span>
                          <span className="ml-2 font-medium text-orange-600">
                            +{formatDuration(routeData.traffic_delay_seconds)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {routeData && routeData.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{routeData.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Traffic Overview */}
            {overview && !overview.error && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Traffic Summary</h2>
                </div>
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600">{overview.incidents_count || 0}</div>
                    <div className="text-sm text-gray-600">Active Incidents</div>
                  </div>
                  
                  {overview.traffic_flows && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 text-sm">Key Locations</h3>
                      {overview.traffic_flows.slice(0, 3).map((flow, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 truncate">{flow.location_name}</span>
                          <span className="font-medium">
                            {flow.current_speed ? `${Math.round(flow.current_speed)} km/h` : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Incidents */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Live Incidents</h2>
                <p className="text-sm text-gray-600">{incidents.length} incidents reported</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {incidents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-2xl mb-2">✅</div>
                    <div>No incidents reported</div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {incidents.slice(0, 10).map((incident, index) => (
                      <div
                        key={incident.id || index}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedIncident?.id === incident.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: getSeverityColor(incident.severity) }}
                              />
                              <span className="text-xs font-medium text-gray-500">
                                {getSeverityLabel(incident.severity)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {incident.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {incident.road_numbers?.join(', ') || 'Unknown location'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TomTomTraffic;