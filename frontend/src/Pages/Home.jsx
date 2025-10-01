import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <img
        src="/trafficwiz-logo.png"
        alt="TrafficWiz Logo"
        className="w-40 mb-6 drop-shadow-lg"
      />
      <h1 className="text-5xl font-extrabold mb-4 text-gray-900">TrafficWiz</h1>
      <p className="text-lg text-gray-600 mb-8">
        Nashville traffic insights at your fingertips 🚦
      </p>

      <div className="flex space-x-6">
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Dashboard
        </Link>
        <Link
          to="/incidents"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Incidents
        </Link>
        <Link
          to="/risk"
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Risk
        </Link>
      </div>
    </div>
  );
}

export default Home;
