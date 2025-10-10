// src/api.js
const j = (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const getHealth = () => fetch('/api/health').then(j);
export const getTraffic = () => fetch('/api/traffic').then(j);
export const getBySeverity = () => fetch('/api/incidents/by-severity').then(j);
export const getByLocation = () => fetch('/api/incidents/by-location').then(j);
export const getByDay = () => fetch('/api/incidents/by-day').then(j);