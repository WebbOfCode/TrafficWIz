/**
 * ============================================================
 * TrafficWiz - HERE Maps Traffic Page
 * ============================================================
 * Purpose: Dedicated page for HERE Maps real-time traffic features
 * 
 * Features:
 * - Live traffic incidents from HERE API
 * - Interactive traffic map with HERE Maps SDK
 * - Traffic flow visualization
 * - Route planning with traffic awareness
 * - Location search and geocoding
 * 
 * Dependencies:
 * - HereMap: Interactive map component
 * - api.js: Backend API functions
 * 
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import SimpleHereMap from '../components/SimpleHereMap';
import { 
  getHereIncidents, 
  calculateHereRoute,
  geocodeHere 
} from '../api';

const HereTraffic = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 36.1627, lng: -86.7816 });
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Route planning state
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeResult, setRouteResult] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadTrafficData();
    // Refresh every 2 minutes
    const interval = setInterval(loadTrafficData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadTrafficData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch incidents for Nashville area
      const [incidentsData] = await Promise.all([
        getHereIncidents({ lat: 36.1627, lng: -86.7816, radius: 20000 }).catch(err => ({ incidents: [], error: err.message }))
      ]);

      if (incidentsData.error) {
        setError(incidentsData.error);
      } else {
        setIncidents(incidentsData.incidents || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading traffic data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle location search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await geocodeHere(searchQuery);
      
      if (results.results && results.results.length > 0) {
        setSearchResults(results.results);
        // Zoom to first result
        const firstResult = results.results[0];
        setMapCenter({ lat: firstResult.position.lat, lng: firstResult.position.lon });
        setMapZoom(14);
      } else {
        alert('No results found for that location');
      }
      setSearchLoading(false);
    } catch (err) {
      console.error('Error searching:', err);
      alert('Failed to search location');
      setSearchLoading(false);
    }
  };

  // Handle incident selection
  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    if (incident.from && incident.from.lat && incident.from.lon) {
      setMapCenter({ lat: incident.from.lat, lng: incident.from.lon });
      setMapZoom(15);
    }
  };

  // Calculate route
  const handleCalculateRoute = async (e) => {
    e.preventDefault();
    if (!routeOrigin.trim() || !routeDestination.trim()) return;

    try {
      setRouteLoading(true);
      setRouteResult(null);

      // Geocode origin and destination
      const [originGeo, destGeo] = await Promise.all([
        geocodeHere(routeOrigin),
        geocodeHere(routeDestination)
      ]);

      if (!originGeo.results?.length || !destGeo.results?.length) {
        alert('Could not find one or both locations');
        setRouteLoading(false);
        return;
      }

      const start = {
        lat: originGeo.results[0].position.lat,
        lon: originGeo.results[0].position.lon
      };
      const end = {
        lat: destGeo.results[0].position.lat,
        lon: destGeo.results[0].position.lon
      };

      const route = await calculateHereRoute(start, end, true);
      
      if (route.routes && route.routes.length > 0) {
        setRouteResult(route.routes[0]);
        // Update map to show route area
        const midLat = (start.lat + end.lat) / 2;
        const midLon = (start.lon + end.lon) / 2;
        setMapCenter({ lat: midLat, lng: midLon });
        setMapZoom(11);
      } else {
        alert('No route found');
      }

      setRouteLoading(false);
    } catch (err) {
      console.error('Error calculating route:', err);
      alert('Failed to calculate route');
      setRouteLoading(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 4: return 'bg-red-100 text-red-800 border-red-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 4: return 'Critical';
      case 3: return 'Major';
      case 2: return 'Minor';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-violet-300">Loading HERE Maps traffic data...</div>
          <div className="text-sm text-violet-400 mt-2">Fetching live incidents and traffic flow...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-violet-300">HERE Maps Live Traffic</h1>
              <p className="text-gray-300 mt-1">Real-time traffic incidents and conditions for Nashville, TN</p>
            </div>
            <button 
              onClick={loadTrafficData}
              disabled={loading}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-600 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-red-300 font-semibold">Error Loading Traffic Data</h3>
                <p className="text-red-200 text-sm mt-1">{error}</p>
                <p className="text-red-300 text-xs mt-2">
                  Please add your HERE API key to the configuration files.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location (e.g., Downtown Nashville, Broadway St)"
              className="flex-1 px-4 py-2 bg-gray-800/50 border border-violet-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-600"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section (Left - 2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Traffic Map */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-violet-600/30">
              <div className="p-4 bg-gray-900/50 border-b border-violet-600/30">
                <h2 className="text-lg font-semibold text-violet-300">Live Traffic Map</h2>
                <p className="text-sm text-gray-300 mt-1">
                  OpenStreetMap with HERE incident data
                </p>
              </div>
              <SimpleHereMap
                center={mapCenter}
                height="500px"
              />
            </div>

            {/* Route Planner */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-violet-600/30">
              <h2 className="text-lg font-semibold text-violet-300 mb-4">Route Planner</h2>
              <form onSubmit={handleCalculateRoute} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-violet-200 mb-1">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    placeholder="Enter starting address"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-200 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={routeDestination}
                    onChange={(e) => setRouteDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={routeLoading}
                  className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-600"
                >
                  {routeLoading ? 'Calculating...' : 'Calculate Route'}
                </button>
              </form>

              {/* Route Results */}
              {routeResult && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
                  <h3 className="font-semibold text-green-300 mb-2">Route Found</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Distance:</span>
                      <span className="font-medium text-white">
                        {(routeResult.summary.lengthInMeters / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Travel Time:</span>
                      <span className="font-medium text-white">
                        {Math.round(routeResult.summary.travelTimeInSeconds / 60)} min
                      </span>
                    </div>
                    {routeResult.summary.trafficDelayInSeconds > 0 && (
                      <div className="flex justify-between text-orange-300">
                        <span>Traffic Delay:</span>
                        <span className="font-medium text-orange-200">
                          +{Math.round(routeResult.summary.trafficDelayInSeconds / 60)} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right - 1/3 width on large screens) */}
          <div className="space-y-6">
            {/* Traffic Summary */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-violet-600/30">
              <h2 className="text-lg font-semibold text-violet-300 mb-4">Traffic Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-violet-900/40 rounded-lg border border-violet-600/30">
                  <span className="text-gray-300">Total Incidents</span>
                  <span className="text-2xl font-bold text-violet-300">{incidents.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-900/30 rounded-lg border border-red-600/50">
                  <span className="text-gray-300">Critical</span>
                  <span className="text-xl font-bold text-red-400">
                    {incidents.filter(i => i.severity === 4).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-900/30 rounded-lg border border-orange-600/50">
                  <span className="text-gray-300">Major</span>
                  <span className="text-xl font-bold text-orange-400">
                    {incidents.filter(i => i.severity === 3).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-900/30 rounded-lg border border-yellow-600/50">
                  <span className="text-gray-300">Minor</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {incidents.filter(i => i.severity === 2).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Incidents List */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-violet-600/30">
              <div className="p-4 bg-gray-900/50 border-b border-violet-600/30">
                <h2 className="text-lg font-semibold text-violet-300">Active Incidents</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {incidents.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    No active incidents reported
                  </div>
                ) : (
                  <div className="divide-y divide-violet-700/30">
                    {incidents.map((incident, index) => (
                      <div
                        key={incident.id || index}
                        onClick={() => handleIncidentClick(incident)}
                        className={`p-4 cursor-pointer hover:bg-violet-900/20 transition-colors ${
                          selectedIncident?.id === incident.id ? 'bg-violet-900/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                            {getSeverityLabel(incident.severity)}
                          </div>
                          {incident.delay > 0 && (
                            <div className="text-xs text-orange-600 font-medium">
                              +{Math.round(incident.delay / 60)} min delay
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-white mb-1">
                          {incident.type || 'Traffic Incident'}
                        </div>
                        <div className="text-xs text-gray-300 line-clamp-2">
                          {incident.description || 'No description available'}
                        </div>
                        {incident.startTime && (
                          <div className="text-xs text-gray-500 mt-2">
                            Started: {new Date(incident.startTime).toLocaleString()}
                          </div>
                        )}
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

export default HereTraffic;
