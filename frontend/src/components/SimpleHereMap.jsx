// Simple map component - displays OpenStreetMap with traffic incidents

import React, { useState, useEffect } from 'react';
import { getHereIncidents } from '../api';

const SimpleHereMap = ({ 
  center = { lat: 36.1627, lng: -86.7816 },
  height = '500px'
}) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIncidents();
  }, [center]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await getHereIncidents({
        lat: center.lat,
        lng: center.lng,
        radius: 20000
      });
      
      if (data.incidents) {
        setIncidents(data.incidents);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // OpenStreetMap embed URL (no API key required)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.1},${center.lat-0.1},${center.lng+0.1},${center.lat+0.1}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <iframe
        src={mapUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Traffic Map"
      />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '14px'
        }}>
          Loading incidents...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          padding: '12px 20px',
          color: '#c00',
          maxWidth: '80%'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default SimpleHereMap;
