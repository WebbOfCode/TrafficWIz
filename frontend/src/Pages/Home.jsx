/**
 * ============================================================
 * TrafficWiz - Home Page Component
 * ============================================================
 * Purpose: Landing page with branding, current weather, and map preview
 * 
 * Features:
 * - TrafficWiz logo and welcome message
 * - Live weather from National Weather Service (NWS) API
 *   - Fetches current observation from nearest station
 *   - Falls back to hourly/regular forecast if observation unavailable
 *   - Displays temperature (°F), condition, and city/state
 *   - Purple translucent card styling
 * - Mapbox static map preview (if VITE_MAPBOX_TOKEN is set)
 *   - Shows Nashville area centered at lon:-86.78, lat:36.16
 *   - Displays helper message if token missing
 * - Navigation buttons to Dashboard, Incidents, and Risk pages
 * 
 * API Integration:
 * - api.weather.gov/points/{lat},{lon} - Get forecast/observation URLs
 * - api.weather.gov/stations/{id}/observations/latest - Current conditions
 * - Mapbox Static Tiles API (optional, requires token)
 * 
 * Environment Variables:
 * - VITE_MAPBOX_TOKEN (optional) - Mapbox public token for map display
 * ============================================================
 */

import { useState, useEffect } from "react";

function Home() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Use NWS API for weather: get observation if possible, otherwise use forecast
    const fetchNws = async () => {
      try {
        const lat = 36.16;
        const lon = -86.78;
        const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
        const pRes = await fetch(pointsUrl);
        if (!pRes.ok) throw new Error(`NWS points request failed: ${pRes.status}`);
  const pData = await pRes.json();
  const city = pData?.properties?.relativeLocation?.properties?.city;
  const state = pData?.properties?.relativeLocation?.properties?.state;
  const locationLabel = city ? (state ? `${city}, ${state}` : city) : null;

        // Try observations first: get stations, then latest observation
        const stationsUrl = pData.properties?.observationStations;
        if (stationsUrl) {
          try {
            const sRes = await fetch(stationsUrl);
            if (sRes.ok) {
              const sData = await sRes.json();
              const stationId = sData?.features?.[0]?.properties?.stationIdentifier;
              const obsUrl = stationId ? `https://api.weather.gov/stations/${stationId}/observations/latest` : null;
              if (obsUrl) {
                const oRes = await fetch(obsUrl);
                if (oRes.ok) {
                  const oData = await oRes.json();
                  const tempC = oData?.properties?.temperature?.value; // Celsius
                  const tempF = typeof tempC === 'number' ? Math.round((tempC * 9) / 5 + 32) : null;
                  const text = oData?.properties?.textDescription || oData?.properties?.shortPhrase || null;
                  const detailed = oData?.properties?.textDescription || null;
                  setWeather({ temp: tempF, condition: text || 'Observation', detailed, location: locationLabel });
                  return; // got current observation
                }
              }
            }
          } catch (obsErr) {
            console.warn('Observation fetch failed, falling back to forecast', obsErr);
          }
        }

        // fallback to forecast (hourly or regular)
        const forecastUrl = pData.properties?.forecastHourly || pData.properties?.forecast;
        if (!forecastUrl) throw new Error('NWS forecast URL not found from points response');
        const fRes = await fetch(forecastUrl);
        if (!fRes.ok) throw new Error(`NWS forecast request failed: ${fRes.status}`);
        const fData = await fRes.json();
        const period = fData.properties?.periods?.[0];
        if (period) {
          setWeather({ temp: period.temperature, condition: period.shortForecast, detailed: period.detailedForecast, location: locationLabel });
        } else {
          setWeather({ temp: null, condition: 'No forecast', detailed: 'No forecast data available', location: locationLabel });
        }
      } catch (err) {
        console.warn('NWS weather fetch failed:', err);
        setWeather({ temp: null, condition: 'Unavailable', detailed: 'Weather service unavailable', location: null });
      }
    };
    fetchNws();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      {/* Logo */}
      <img
        src="/trafficwiz-logo.png"
        alt="TrafficWiz Logo"
        className="w-40 mb-6 drop-shadow-[0_0_10px_#A855F7]"
      />

      {/* Title */}
      <h1 className="text-5xl font-extrabold text-violet-400 mb-3">
        Welcome to TrafficWiz
      </h1>
      <p className="text-lg mb-8 max-w-xl text-gray-300">
        Real-time traffic, weather, and risk insights for Nashville.  
        Data-driven intelligence powered by Flask, MySQL, and React.
      </p>

      {/* Weather Widget */}
      {weather && (
        <div className="rounded-lg p-4 mb-8 shadow-lg w-80 bg-violet-800/60 backdrop-blur-sm border border-violet-600">
          <h2 className="text-md font-bold mb-2 text-white">Current Weather (NWS){weather.location ? ` — ${weather.location}` : ''}</h2>
          <p className="text-3xl font-bold text-white">
            {weather.temp !== null ? (`${weather.temp}°F`) : "—"}
            <span className="text-lg text-violet-200 ml-2">{weather.condition}</span>
          </p>
          {weather.detailed && (
            <p className="text-sm text-violet-200/90 mt-2">{weather.detailed}</p>
          )}
        </div>
      )}

      {/* Map Preview */}
      <div className="rounded-lg overflow-hidden shadow-xl border border-gray-300">
        {(() => {
          const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!MAPBOX_TOKEN) {
            return (
              <div className="p-8 bg-black/20 text-center text-gray-200">
                <div className="mb-2">Mapbox token not configured.</div>
                <div className="text-xs">Set <code className="bg-black/40 px-1">VITE_MAPBOX_TOKEN</code> in <code className="bg-black/40 px-1">frontend/.env</code> to show a map.</div>
              </div>
            );
          }
          const center = "-86.78,36.16,10,0"; // lon,lat,zoom,bearing
          const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/${center}/600x300?access_token=${MAPBOX_TOKEN}`;
          return <img src={url} alt="Nashville Map" className="rounded-lg" />;
        })()}

        <p className="text-sm text-gray-400 mt-2">Map centered on <strong>Nashville, TN</strong></p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-6 mt-10">
        <a
          href="/dashboard"
          className="px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Dashboard
        </a>
        <a
          href="/incidents"
          className="px-6 py-3 bg-purple-900 hover:bg-purple-800 text-white rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Incidents
        </a>
        <a
          href="/risk"
          className="px-6 py-3 bg-black border border-violet-500 hover:bg-violet-950 text-violet-300 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Risk
        </a>
      </div>
    </div>
  );
}

export default Home;
