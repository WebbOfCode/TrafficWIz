/**
 * ============================================================
 * TrafficWiz - HERE Maps Component
 * ============================================================
 * Purpose: Interactive map component using HERE Maps SDK
 * 
 * Features:
 * - Real-time traffic visualization
 * - Live traffic incidents display
 * - Route planning with traffic
 * - Location search and geocoding
 * - Customizable map styles and overlays
 * 
 * Dependencies:
 * - HERE Maps API (via CDN)
 * - React hooks for state management
 * 
 * Props:
 * - center: Initial map center coordinates
 * - zoom: Initial zoom level
 * - showTraffic: Whether to show traffic layer
 * - showIncidents: Whether to show incident markers
 * - height: Map container height
 * 
 * Usage:
 * <HereMap 
 *   center={{ lat: 36.1627, lng: -86.7816 }} 
 *   zoom={12}
 *   showTraffic={true}
 *   showIncidents={true}
 *   height="400px"
 * />
 * ============================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { HERE_CONFIG } from '../config';
import { getHereIncidents, getHereTrafficFlow, calculateHereRoute } from '../api';

const HereMap = ({ 
  center = { lat: 36.1627, lng: -86.7816 }, // Nashville coordinates
  zoom = 12,
  showTraffic = true,
  showIncidents = true,
  height = '400px',
  onLocationSelect = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const platformRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const markersRef = useRef([]);

  // Load HERE Maps SDK dynamically
  useEffect(() => {
    const loadHereSDK = () => {
      return new Promise((resolve, reject) => {
        // Check if SDK is already loaded
        if (window.H) {
          resolve(window.H);
          return;
        }

        // Load HERE Maps CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
        document.head.appendChild(cssLink);

        // Load HERE Maps Core
        const coreScript = document.createElement('script');
        coreScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-core.js';
        coreScript.type = 'text/javascript';
        coreScript.charset = 'utf-8';

        // Load HERE Maps Service
        const serviceScript = document.createElement('script');
        serviceScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-service.js';
        serviceScript.type = 'text/javascript';
        serviceScript.charset = 'utf-8';

        // Load HERE Maps UI
        const uiScript = document.createElement('script');
        uiScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-ui.js';
        uiScript.type = 'text/javascript';
        uiScript.charset = 'utf-8';

        // Load HERE Maps Events
        const eventsScript = document.createElement('script');
        eventsScript.src = 'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js';
        eventsScript.type = 'text/javascript';
        eventsScript.charset = 'utf-8';

        coreScript.onload = () => {
          document.head.appendChild(serviceScript);
          serviceScript.onload = () => {
            document.head.appendChild(uiScript);
            uiScript.onload = () => {
              document.head.appendChild(eventsScript);
              eventsScript.onload = () => {
                if (window.H) {
                  resolve(window.H);
                } else {
                  reject(new Error('HERE SDK failed to load'));
                }
              };
            };
          };
        };

        coreScript.onerror = () => reject(new Error('Failed to load HERE SDK'));
        document.head.appendChild(coreScript);
      });
    };

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!HERE_CONFIG.apiKey) {
          throw new Error('HERE API key not configured. Please add your API key to config.js');
        }

        // Load HERE SDK
        await loadHereSDK();

        // Initialize HERE Platform
        const platform = new window.H.service.Platform({
          apikey: HERE_CONFIG.apiKey
        });
        platformRef.current = platform;

        // Get default map types
        const defaultLayers = platform.createDefaultLayers();

        // Create map instance
        const map = new window.H.Map(
          mapRef.current,
          defaultLayers.vector.normal.map,
          {
            zoom: zoom,
            center: center
          }
        );

        // Add map events (pan, zoom, etc.)
        const behavior = new window.H.mapevents.Behavior(
          new window.H.mapevents.MapEvents(map)
        );

        // Add UI controls
        const ui = window.H.ui.UI.createDefault(map, defaultLayers);

        mapInstanceRef.current = map;

        // Add traffic layer if enabled
        if (showTraffic) {
          map.addLayer(defaultLayers.vector.normal.traffic);
        }

        // Fetch and display incidents if enabled
        if (showIncidents) {
          fetchIncidents();
        }

        // Handle location selection
        if (onLocationSelect) {
          map.addEventListener('tap', (evt) => {
            const coord = map.screenToGeo(
              evt.currentPointer.viewportX,
              evt.currentPointer.viewportY
            );
            onLocationSelect({ lat: coord.lat, lng: coord.lng });
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing HERE map:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
      }
    };
  }, []);

  // Fetch traffic incidents
  const fetchIncidents = async () => {
    try {
      const data = await getHereIncidents({
        lat: center.lat,
        lng: center.lng,
        radius: 20000 // 20km radius
      });

      if (data.incidents) {
        setIncidents(data.incidents);
        displayIncidents(data.incidents);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  // Display incidents on map
  const displayIncidents = (incidentList) => {
    if (!mapInstanceRef.current || !window.H) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeObject(marker);
    });
    markersRef.current = [];

    // Add new markers
    incidentList.forEach(incident => {
      const from = incident.from;
      if (from && from.lat && from.lon) {
        // Create marker
        const icon = new window.H.map.Icon(getIncidentIcon(incident.severity));
        const marker = new window.H.map.Marker(
          { lat: from.lat, lng: from.lon },
          { icon: icon }
        );

        // Add info bubble on click
        marker.addEventListener('tap', () => {
          const bubble = new window.H.ui.InfoBubble(
            { lat: from.lat, lng: from.lon },
            {
              content: `
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                    ${incident.type || 'Incident'}
                  </h3>
                  <p style="margin: 0; font-size: 12px;">
                    ${incident.description || 'No description available'}
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">
                    Severity: ${getSeverityLabel(incident.severity)}
                  </p>
                  ${incident.delay ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">
                    Delay: ${Math.round(incident.delay / 60)} min
                  </p>` : ''}
                </div>
              `
            }
          );
          window.H.ui.UI.createDefault(mapInstanceRef.current, platformRef.current.createDefaultLayers()).addBubble(bubble);
        });

        mapInstanceRef.current.addObject(marker);
        markersRef.current.push(marker);
      }
    });
  };

  // Get incident icon based on severity
  const getIncidentIcon = (severity) => {
    const colors = {
      4: '#dc2626', // red for high severity
      3: '#f59e0b', // orange for medium
      2: '#eab308', // yellow for low
      1: '#22c55e'  // green for minimal
    };
    const color = colors[severity] || '#6b7280';
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
      </svg>
    `)}`;
  };

  // Get severity label
  const getSeverityLabel = (severity) => {
    const labels = {
      4: 'Critical',
      3: 'Major',
      2: 'Minor',
      1: 'Low'
    };
    return labels[severity] || 'Unknown';
  };

  // Update map center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // Update zoom when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && zoom) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>Loading map...</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Initializing HERE Maps SDK
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          padding: '12px 20px',
          color: '#c00',
          zIndex: 1000,
          maxWidth: '80%'
        }}>
          <strong>Map Error:</strong> {error}
        </div>
      )}

      {showIncidents && incidents.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '14px',
          zIndex: 999
        }}>
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};

export default HereMap;
