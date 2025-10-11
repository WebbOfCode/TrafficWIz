import { useState, useEffect } from "react";

function Home({ darkMode }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "demo";
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Nashville,US&appid=${API_KEY}&units=imperial`
        );
        const data = await response.json();
        setWeather({
          temp: Math.round(data.main?.temp || 72),
          condition: data.weather?.[0]?.main || "Clear",
          humidity: data.main?.humidity || 60,
        });
      } catch (err) {
        console.error("Weather fetch failed:", err);
        setWeather({ temp: 999, condition: "Clear", humidity: 60 });
      }
    };
    fetchWeather();
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
        <div
          className={`rounded-lg p-4 mb-8 shadow-lg w-64 ${
            darkMode ? "bg-gray-800 border border-violet-700" : "bg-white"
          }`}
        >
          <h2 className="text-md font-bold mb-2 text-violet-400">Current Weather</h2>
          <p className="text-3xl font-bold">
            {weather.temp}°F <span className="text-lg text-gray-400">{weather.condition}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">Humidity: {weather.humidity}%</p>
        </div>
      )}

      {/* Map Preview */}
      <div
        className={`rounded-lg overflow-hidden shadow-xl border ${
          darkMode ? "border-violet-700" : "border-gray-300"
        }`}
      >
        <img
          src={`https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-86.78,36.16,10,0/600x300?access_token=YOUR_MAPBOX_ACCESS_TOKEN`}
          alt="Nashville Map"
          className="rounded-lg"
        />
        <p className="text-sm text-gray-400 mt-2">
          Map centered on <strong>Nashville, TN</strong>
        </p>
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
