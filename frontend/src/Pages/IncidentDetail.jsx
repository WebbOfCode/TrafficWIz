// Incident detail page - shows full information for a single incident

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../config";

function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchIncidentDetails() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/traffic/${id}`);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        setIncident(data.incident || null);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIncidentDetails();
  }, [id]);

  if (loading) return <p className="text-gray-400">Loading incident...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!incident) return <p className="text-gray-400">Incident not found.</p>;

  return (
    <div className="p-4 text-white">
      <Link to="/incidents" className="text-sm text-violet-300 mb-4 inline-block">← Back to incidents</Link>
      <h2 className="text-3xl font-bold mb-2 text-violet-300">Incident Details</h2>
      
      <div className="card p-4 mt-4 bg-black/40 border border-violet-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{incident.location}</h3>
            <p className="text-sm text-gray-300 mt-1">{new Date(incident.date).toLocaleString()}</p>
          </div>
          <div className={`font-bold px-3 py-1 rounded ${
            incident.severity === 'High' ? 'bg-red-600 text-white' : 
            incident.severity === 'Medium' ? 'bg-yellow-500 text-black' : 
            'bg-green-600 text-white'
          }`}>
            {incident.severity}
          </div>
        </div>

        <hr className="my-4 border-violet-700" />

        <h4 className="text-md font-semibold text-gray-300">Description</h4>
        <p className="text-gray-200 mt-2">{incident.description}</p>

        {incident.details && (
          <>
            <h4 className="text-md font-semibold text-gray-300 mt-4">Details</h4>
            <pre className="text-sm text-gray-200 bg-black/20 p-3 rounded mt-2 overflow-x-auto">
              {JSON.stringify(incident.details, null, 2)}
            </pre>
          </>
        )}

        <div className="mt-4 text-sm text-gray-400">ID: {incident.id}</div>
      </div>
    </div>
  );
}

export default IncidentDetail;
