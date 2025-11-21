// Home page - landing page with logo, weather, and map preview

import { useState, useEffect } from "react";
import SimpleHereMap from "../components/SimpleHereMap";

function Home() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Fetch current weather from National Weather Service
    // We prefer live observations over forecasts for accuracy
    const fetchWeather = async () => {
      try {
        const nashvilleLat = 36.16;
        const nashvilleLon = -86.78;
        
        // Get the metadata for this location (includes station info and forecast URLs)
        const pointsUrl = `https://api.weather.gov/points/${nashvilleLat},${nashvilleLon}`;
        const pointsResponse = await fetch(pointsUrl);
        if (!pointsResponse.ok) throw new Error(`Points API failed: ${pointsResponse.status}`);
        
        const pointsData = await pointsResponse.json();
        const city = pointsData?.properties?.relativeLocation?.properties?.city;
        const state = pointsData?.properties?.relativeLocation?.properties?.state;
        const location = city ? (state ? `${city}, ${state}` : city) : null;

        // Try to get current observation from nearest weather station
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
                  const tempFahrenheit = typeof tempCelsius === 'number' 
                    ? Math.round((tempCelsius * 9) / 5 + 32) 
                    : null;
                  const condition = observationData?.properties?.textDescription || 'Observation';
                  const details = observationData?.properties?.textDescription || null;
                  
                  setWeather({ temp: tempFahrenheit, condition, detailed: details, location });
                  return;
                }
              }
            }
          } catch (observationError) {
            console.warn('Could not fetch observation, using forecast instead', observationError);
          }
        }

        // If observation failed, fall back to forecast
        const forecastUrl = pointsData.properties?.forecastHourly || pointsData.properties?.forecast;
        if (!forecastUrl) throw new Error('No forecast URL available');
        
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) throw new Error(`Forecast API failed: ${forecastResponse.status}`);
        
        const forecastData = await forecastResponse.json();
        const currentPeriod = forecastData.properties?.periods?.[0];
        
        if (currentPeriod) {
          setWeather({ 
            temp: currentPeriod.temperature, 
            condition: currentPeriod.shortForecast, 
            detailed: currentPeriod.detailedForecast, 
            location 
          });
        } else {
          setWeather({ temp: null, condition: 'No forecast', detailed: 'No forecast available', location });
        }
      } catch (error) {
        console.warn('Weather fetch failed:', error);
        setWeather({ temp: null, condition: 'Unavailable', detailed: 'Weather service unavailable', location: null });
      }
    };
    
    fetchWeather();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <img
        src="/trafficwiz-logo.png"
        alt="TrafficWiz Logo"
        className="w-40 mb-6 drop-shadow-[0_0_10px_#A855F7]"
      />

      <h1 className="text-5xl font-extrabold text-violet-400 mb-3">
        Welcome to TrafficWiz
      </h1>
      <p className="text-lg mb-8 max-w-xl text-gray-300">
        Real-time traffic, weather, and risk insights for Nashville.
        Data-driven intelligence powered by Flask, MySQL, and React.
      </p>

      {weather && (
        <div className="rounded-lg p-4 mb-8 shadow-lg w-80 bg-violet-800/60 backdrop-blur-sm border border-violet-600">
          <h2 className="text-md font-bold mb-2 text-white">
            Current Weather (NWS){weather.location ? ` — ${weather.location}` : ''}
          </h2>
          <p className="text-3xl font-bold text-white">
            {weather.temp !== null ? `${weather.temp}°F` : "—"}
            <span className="text-lg text-violet-200 ml-2">{weather.condition}</span>
          </p>
          {weather.detailed && (
            <p className="text-sm text-violet-200/90 mt-2">{weather.detailed}</p>
          )}
        </div>
      )}

      <div className="rounded-lg overflow-hidden shadow-xl border border-violet-600/30 w-full max-w-3xl">
        <SimpleHereMap
          center={{ lat: 36.1627, lng: -86.7816 }}
          height="400px"
        />
        <p className="text-sm text-gray-400 mt-2 text-center">
          Interactive map of <strong>Nashville, TN</strong>
        </p>
      </div>

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
