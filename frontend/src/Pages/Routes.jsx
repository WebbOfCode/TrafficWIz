// Routes page - plan trips with weather-aware recommendations and traffic alerts

import { useState, useEffect } from "react";
import { geocodeHere, calculateHereRoute, getHereIncidents } from "../api";
import SimpleHereMap from "../components/SimpleHereMap";

function Routes() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 36.1627, lng: -86.7816 });

  // Fetch current weather from National Weather Service
  const fetchWeatherForLocation = async (lat, lon) => {
    try {
      const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
      const pointsResponse = await fetch(pointsUrl);
      if (!pointsResponse.ok) return null;
      
      const pointsData = await pointsResponse.json();
      const city = pointsData?.properties?.relativeLocation?.properties?.city;
      const state = pointsData?.properties?.relativeLocation?.properties?.state;
      
      // Try to get real-time observation from weather station
      const stationsUrl = pointsData.properties?.observationStations;
      if (stationsUrl) {
        try {
          const stationsResponse = await fetch(stationsUrl);
          if (stationsResponse.ok) {
            const stationsData = await stationsResponse.json();
            const stationId = stationsData?.features?.[0]?.properties?.stationIdentifier;
            if (stationId) {
              const observationUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
              const observationResponse = await fetch(observationUrl);
              if (observationResponse.ok) {
                const observationData = await observationResponse.json();
                const tempCelsius = observationData?.properties?.temperature?.value;
                const tempFahrenheit = typeof tempCelsius === 'number' ? Math.round((tempCelsius * 9) / 5 + 32) : null;
                const condition = observationData?.properties?.textDescription || 'Clear';
                const windSpeedKmh = observationData?.properties?.windSpeed?.value;
                const visibilityMeters = observationData?.properties?.visibility?.value;
                
                return {
                  temp: tempFahrenheit,
                  condition,
                  windSpeed: windSpeedKmh ? Math.round(windSpeedKmh * 0.621371) : null,
                  visibility: visibilityMeters ? Math.round(visibilityMeters * 0.000621371) : null,
                  location: city && state ? `${city}, ${state}` : 'Unknown',
                  lat,
                  lon
                };
              }
            }
          }
        } catch (error) {
          console.warn('Weather observation fetch failed', error);
        }
      }
      
      // Fall back to forecast if no observation available
      const forecastUrl = pointsData.properties?.forecastHourly || pointsData.properties?.forecast;
      if (forecastUrl) {
        const forecastResponse = await fetch(forecastUrl);
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          const currentPeriod = forecastData.properties?.periods?.[0];
          if (currentPeriod) {
            return {
              temp: currentPeriod.temperature,
              condition: currentPeriod.shortForecast,
              windSpeed: parseInt(currentPeriod.windSpeed) || null,
              visibility: null,
              location: city && state ? `${city}, ${state}` : 'Unknown',
              lat,
              lon
            };
          }
        }
      }
      
      return null;
    } catch (err) {
      console.error('Weather fetch error:', err);
      return null;
    }
  };

  // Analyze weather conditions for travel safety
  const analyzeWeatherConditions = (weatherData) => {
    if (!weatherData) return { safe: true, warnings: [], severity: 'low' };
    
    const warnings = [];
    let severity = 'low';
    
    const condition = weatherData.condition?.toLowerCase() || '';
    
    // Detect dangerous weather conditions
    if (condition.includes('snow') || condition.includes('ice') || condition.includes('sleet')) {
      warnings.push('Winter weather conditions - Roads may be icy or snow-covered');
      severity = 'high';
    } else if (condition.includes('rain') || condition.includes('storm') || condition.includes('thunderstorm')) {
      warnings.push('Wet road conditions - Reduce speed and increase following distance');
      severity = condition.includes('heavy') || condition.includes('storm') ? 'high' : 'medium';
    } else if (condition.includes('fog')) {
      warnings.push('Low visibility due to fog - Use headlights and drive carefully');
      severity = 'medium';
    }
    
    // Check visibility levels
    if (weatherData.visibility !== null && weatherData.visibility < 2) {
      warnings.push(`Very low visibility (${weatherData.visibility} mi) - Hazardous driving conditions`);
      severity = 'high';
    } else if (weatherData.visibility !== null && weatherData.visibility < 5) {
      warnings.push(`Reduced visibility (${weatherData.visibility} mi) - Use caution`);
      if (severity === 'low') severity = 'medium';
    }
    
    // Check wind speeds
    if (weatherData.windSpeed && weatherData.windSpeed > 40) {
      warnings.push(`High winds (${weatherData.windSpeed} mph) - Watch for debris and control issues`);
      severity = 'high';
    } else if (weatherData.windSpeed && weatherData.windSpeed > 25) {
      warnings.push(`Gusty winds (${weatherData.windSpeed} mph) - Use caution with high-profile vehicles`);
      if (severity === 'low') severity = 'medium';
    }
    
    // Check temperature
    if (weatherData.temp !== null && weatherData.temp <= 32) {
      warnings.push(`🧊 Freezing temperatures (${weatherData.temp}°F) - Watch for ice on bridges and overpasses`);
      if (severity === 'low') severity = 'medium';
    }
    
    return {
      safe: severity === 'low',
      warnings,
      severity
    };
  };

  const handleCalculateRoute = async (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both origin and destination');
      return;
    }

    try {
      setLoading(true);
      setRoute(null);
      setWeather(null);

      // Geocode both locations
      const [originGeo, destGeo] = await Promise.all([
        geocodeHere(origin),
        geocodeHere(destination)
      ]);

      if (!originGeo.results?.length || !destGeo.results?.length) {
        alert('Could not find one or both locations');
        setLoading(false);
        return;
      }

      const originPos = originGeo.results[0].position;
      const destPos = destGeo.results[0].position;

      // Calculate route
      const routeData = await calculateHereRoute(
        `${originPos.lat},${originPos.lon}`,
        `${destPos.lat},${destPos.lon}`
      );

      if (routeData.route) {
        setRoute(routeData.route);
        
        // Center map on midpoint
        const midLat = (originPos.lat + destPos.lat) / 2;
        const midLon = (originPos.lon + destPos.lon) / 2;
        setMapCenter({ lat: midLat, lng: midLon });

        // Fetch weather for both locations
        setWeatherLoading(true);
        const [originWeather, destWeather] = await Promise.all([
          fetchWeatherForLocation(originPos.lat, originPos.lon),
          fetchWeatherForLocation(destPos.lat, destPos.lon)
        ]);

        setWeather({
          origin: originWeather,
          destination: destWeather
        });
        setWeatherLoading(false);

        // Fetch incidents along route
        const incidentsData = await getHereIncidents({
          lat: midLat,
          lng: midLon,
          radius: 25000
        });
        setIncidents(incidentsData.incidents || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Route calculation error:', err);
      alert('Failed to calculate route. Please try again.');
      setLoading(false);
      setWeatherLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-900/30 border-red-600/50 text-red-300';
      case 'medium': return 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300';
      default: return 'bg-green-900/30 border-green-600/50 text-green-300';
    }
  };

  return (
    <div className="p-6 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-violet-300">Weather-Aware Route Planning</h2>
      <p className="text-gray-300 mb-8">
        Plan your route with real-time weather conditions and traffic insights
      </p>

      {/* Route Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
            <h3 className="text-xl font-semibold text-violet-300 mb-4">Enter Route Details</h3>
            <form onSubmit={handleCalculateRoute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-violet-200 mb-2">
                  Starting Location
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g., Downtown Nashville, 100 Broadway"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-violet-200 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Nashville International Airport"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                {loading ? '🔄 Calculating Route...' : '🗺️ Calculate Route with Weather'}
              </button>
            </form>
          </div>

          {/* Route Map */}
          {route && (
            <div className="mt-6 bg-gray-800/60 backdrop-blur-sm rounded-lg overflow-hidden border border-violet-600/30">
              <div className="p-4 bg-gray-900/50 border-b border-violet-600/30">
                <h3 className="text-lg font-semibold text-violet-300">Route Map</h3>
              </div>
              <SimpleHereMap center={mapCenter} height="400px" />
            </div>
          )}
        </div>

        {/* Weather & Route Info Sidebar */}
        <div className="space-y-6">
          {/* Route Summary */}
          {route && (
            <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 backdrop-blur-sm rounded-lg p-6 border border-violet-500/30">
              <h3 className="text-lg font-semibold text-violet-200 mb-4">📍 Route Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Distance:</span>
                  <span className="font-bold text-white">
                    {(route.summary.lengthInMeters / 1609.34).toFixed(1)} mi
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Travel Time:</span>
                  <span className="font-bold text-white">
                    {Math.round(route.summary.travelTimeInSeconds / 60)} min
                  </span>
                </div>
                {route.summary.trafficDelayInSeconds > 0 && (
                  <div className="flex justify-between text-orange-300">
                    <span>Traffic Delay:</span>
                    <span className="font-bold text-orange-200">
                      +{Math.round(route.summary.trafficDelayInSeconds / 60)} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weather Conditions */}
          {weatherLoading && (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-violet-600/30">
              <p className="text-violet-300 text-center">☁️ Fetching weather...</p>
            </div>
          )}

          {weather && !weatherLoading && (
            <div className="space-y-4">
              {/* Origin Weather */}
              {weather.origin && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-violet-600/30">
                  <h4 className="text-sm font-semibold text-violet-300 mb-2">
                    🌤️ Origin Weather
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">{weather.origin.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {weather.origin.temp}°F
                    </span>
                    <span className="text-sm text-violet-200">
                      {weather.origin.condition}
                    </span>
                  </div>
                  {weather.origin.windSpeed && (
                    <p className="text-xs text-gray-400 mt-2">
                      Wind: {weather.origin.windSpeed} mph
                    </p>
                  )}
                </div>
              )}

              {/* Destination Weather */}
              {weather.destination && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-violet-600/30">
                  <h4 className="text-sm font-semibold text-violet-300 mb-2">
                    🌤️ Destination Weather
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">{weather.destination.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {weather.destination.temp}°F
                    </span>
                    <span className="text-sm text-violet-200">
                      {weather.destination.condition}
                    </span>
                  </div>
                  {weather.destination.windSpeed && (
                    <p className="text-xs text-gray-400 mt-2">
                      Wind: {weather.destination.windSpeed} mph
                    </p>
                  )}
                </div>
              )}

              {/* Weather Warnings */}
              {(weather.origin || weather.destination) && (() => {
                const originAnalysis = analyzeWeatherConditions(weather.origin);
                const destAnalysis = analyzeWeatherConditions(weather.destination);
                const allWarnings = [...originAnalysis.warnings, ...destAnalysis.warnings];
                const worstSeverity = originAnalysis.severity === 'high' || destAnalysis.severity === 'high' 
                  ? 'high' 
                  : (originAnalysis.severity === 'medium' || destAnalysis.severity === 'medium' ? 'medium' : 'low');

                if (allWarnings.length > 0) {
                  return (
                    <div className={`rounded-lg p-4 border ${getSeverityColor(worstSeverity)}`}>
                      <h4 className="font-semibold mb-2">
                        {worstSeverity === 'high' ? 'Travel Advisory' : 'Weather Notice'}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {allWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
                      <p className="text-green-300 text-sm">
                        Good weather conditions for travel
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {/* Traffic Incidents */}
          {incidents.length > 0 && (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-violet-600/30">
              <h4 className="text-sm font-semibold text-violet-300 mb-3">
                🚧 Incidents Along Route
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {incidents.slice(0, 5).map((incident, idx) => (
                  <div key={idx} className="text-xs bg-red-900/30 border border-red-600/50 rounded p-2">
                    <div className="font-semibold text-red-300">
                      {incident.type || 'Traffic Incident'}
                    </div>
                    <div className="text-gray-400 mt-1">
                      {incident.description || 'No details available'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Routes;
