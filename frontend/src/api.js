// src/api.js
const j = (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const getHealth = () => fetch('/api/health').then(j);
export const getTraffic = () => fetch('/api/traffic').then(j);
export const getBySeverity = () => fetch('/api/incidents/by-severity').then(j);
export const getByLocation = () => fetch('/api/incidents/by-location').then(j);
export const getByDay = () => fetch('/api/incidents/by-day').then(j);\n\n// TomTom API functions\nexport const getTomTomTrafficFlow = (lat, lon, zoom = 10) => \n  fetch(`/api/tomtom/traffic-flow?lat=${lat}&lon=${lon}&zoom=${zoom}`).then(j);\n\nexport const getTomTomIncidents = (bbox = '-87.0,36.0,-86.5,36.4', categories = null) => {\n  const url = categories \n    ? `/api/tomtom/traffic-incidents?bbox=${bbox}&categories=${categories}`\n    : `/api/tomtom/traffic-incidents?bbox=${bbox}`;\n  return fetch(url).then(j);\n};\n\nexport const calculateTomTomRoute = (start, end, avoidTraffic = true) => \n  fetch('/api/tomtom/route', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ start, end, avoid_traffic: avoidTraffic })\n  }).then(j);\n\nexport const geocodeTomTom = (address) => \n  fetch(`/api/tomtom/geocode?address=${encodeURIComponent(address)}`).then(j);\n\nexport const getNashvilleTrafficOverview = () => \n  fetch('/api/tomtom/nashville-overview').then(j);\n\nexport const getTomTomStatus = () => \n  fetch('/api/tomtom/status').then(j);