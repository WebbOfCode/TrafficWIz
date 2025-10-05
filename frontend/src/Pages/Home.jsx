import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <img
        src="/trafficwiz-logo.png"
        alt="TrafficWiz Logo"
        className="w-40 mb-6 drop-shadow-[0_0_10px_#A855F7]"
      />
      <h1 className="text-5xl font-extrabold text-violet-400 mb-4">
        Welcome to TrafficWiz
      </h1>
      <p className="text-lg text-gray-300 mb-8 max-w-xl">
        Analyze traffic congestion and safety in style — powered by MySQL and Python.
      </p>

      <div className="flex space-x-6">
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Dashboard
        </Link>
        <Link
          to="/incidents"
          className="px-6 py-3 bg-purple-900 hover:bg-purple-800 text-white rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Incidents
        </Link>
        <Link
          to="/risk"
          className="px-6 py-3 bg-black border border-violet-500 hover:bg-violet-950 text-violet-300 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          Risk
        </Link>
      </div>
    </div>
  );
}

export default Home;
