// src/api.js
const j = (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const getHealth = () => fetch('/api/health').then(j);
export const getTraffic = (limit = 500) => fetch(`/api/traffic?limit=${limit}`).then(j);
export const getBySeverity = () => fetch('/api/incidents/by-severity').then(j);
export const getByLocation = () => fetch('/api/incidents/by-location').then(j);
export const getByDay = () => fetch('/api/incidents/by-day').then(j);

// HERE Maps API functions
export const getHereTrafficFlow = (lat, lng, radius = 5000) => 
  fetch(`/api/here/traffic-flow?lat=${lat}&lon=${lng}&radius=${radius}`).then(j);

export const getHereIncidents = ({ bbox, lat, lng, radius = 10000 }) => {
  if (bbox) {
    return fetch(`/api/here/traffic-incidents?bbox=${bbox}`).then(j);
  } else if (lat && lng) {
    return fetch(`/api/here/traffic-incidents?lat=${lat}&lon=${lng}&radius=${radius}`).then(j);
  }
  return fetch('/api/here/traffic-incidents?bbox=-87.0,36.0,-86.5,36.4').then(j);
};

export const calculateHereRoute = (start, end, departureTime = null) => 
  fetch('/api/here/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end, departure_time: departureTime })
  }).then(j);

export const geocodeHere = (address) => 
  fetch(`/api/here/geocode?address=${encodeURIComponent(address)}`).then(j);

export const getNashvilleTrafficOverview = () => 
  fetch('/api/here/nashville-overview').then(j);

export const getHereStatus = () => 
  fetch('/api/here/status').then(j);