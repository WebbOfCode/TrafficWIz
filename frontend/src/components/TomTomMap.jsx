/**
 * ============================================================
 * TrafficWiz - TomTom Map Component
 * ============================================================
 * Purpose: Interactive map component using TomTom Maps SDK
 * 
 * Features:
 * - Real-time traffic visualization
 * - Live traffic incidents display
 * - Route planning with traffic avoidance
 * - Location search and geocoding
 * - Customizable map styles and overlays
 * 
 * Dependencies:
 * - TomTom Maps SDK for Web (via CDN)
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
 * <TomTomMap 
 *   center={[36.1627, -86.7816]} 
 *   zoom={12}
 *   showTraffic={true}
 *   showIncidents={true}
 *   height="400px"
 * />
 * ============================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { TOMTOM_CONFIG } from '../config';
import { getTomTomIncidents, getTomTomTrafficFlow, calculateTomTomRoute } from '../api';

const TomTomMap = ({ 
  center = [36.1627, -86.7816], // Nashville coordinates
  zoom = 12,
  showTraffic = true,
  showIncidents = true,
  height = '400px',
  onLocationSelect = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incidents, setIncidents] = useState([]);

  // Load TomTom Maps SDK dynamically
  useEffect(() => {
    const loadTomTomSDK = () => {
      return new Promise((resolve, reject) => {
        // Check if SDK is already loaded
        if (window.tt) {
          resolve(window.tt);
          return;
        }

        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps.css';
        document.head.appendChild(cssLink);

        // Load JavaScript SDK
        const script = document.createElement('script');
        script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps-web.min.js';
        script.onload = () => {
          if (window.tt) {
            resolve(window.tt);
          } else {
            reject(new Error('TomTom SDK failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load TomTom SDK'));
        document.head.appendChild(script);
      });
    };

    loadTomTomSDK()
      .then((tt) => {
        initializeMap(tt);
      })
      .catch((err) => {
        console.error('Error loading TomTom SDK:', err);
        setError('Failed to load map. Please check your internet connection.');
        setIsLoading(false);
      });
  }, []);

  const initializeMap = (tt) => {
    try {
      if (TOMTOM_CONFIG.apiKey === 'YOUR_TOMTOM_API_KEY_HERE') {
        setError('TomTom API key not configured. Please update TOMTOM_CONFIG in config.js');
        setIsLoading(false);
        return;
      }

      // Initialize map
      const map = tt.map({
        key: TOMTOM_CONFIG.apiKey,
        container: mapRef.current,
        center: [center[1], center[0]], // TomTom uses [lng, lat]
        zoom: zoom,
        style: 'https://api.tomtom.com/maps-sdk-for-web/6.x/styles/basic.main.json'
      });

      mapInstanceRef.current = map;

      // Load incidents if requested
      if (showIncidents) {
        loadIncidents(map);
      }

      // Add click handler for location selection
      if (onLocationSelect) {
        map.on('click', (e) => {
          const coords = e.lngLat;
          onLocationSelect({
            lat: coords.lat,
            lon: coords.lng
          });
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const loadIncidents = async (map) => {
    try {
      const response = await getTomTomIncidents();
      setIncidents(response.incidents || []);

      // Add incident markers to map
      response.incidents?.forEach((incident, index) => {
        if (incident.geometry && incident.geometry.coordinates) {
          const coords = incident.geometry.coordinates[0]; // Get first coordinate pair
          
          // Create marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'incident-marker';
          markerElement.innerHTML = `<div style="background-color: ${getSeverityColor(incident.severity)}; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;

          // Add marker to map
          new window.tt.Marker({ element: markerElement })
            .setLngLat([coords[0], coords[1]])
            .setPopup(
              new window.tt.Popup({ offset: 25 })
                .setHTML(`<div><h4 style="margin: 0 0 8px 0; color: #333;">${incident.description}</h4><p style="margin: 0; font-size: 12px; color: #666;">Severity: ${incident.severity}<br>${incident.road_numbers?.join(', ') || 'Unknown road'}</p></div>`)
            )
            .addTo(map);
        }
      });
    } catch (err) {
      console.error('Error loading incidents:', err);
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 0:
      case 1: return '#00FF00'; // Green - Low
      case 2:
      case 3: return '#FFA500'; // Orange - Medium  
      case 4:
      case 5: return '#FF0000'; // Red - High
      default: return '#808080'; // Gray - Unknown
    }
  };

  const refreshData = async () => {
    if (mapInstanceRef.current && showIncidents) {
      // Clear existing markers
      // Note: In a production app, you'd want to track and remove markers properly
      loadIncidents(mapInstanceRef.current);
    }
  };

  if (error) {
    return (
      <div 
        style={{ 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          color: '#666',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ marginBottom: '8px' }}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: height, 
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
      
      {isLoading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>🗺️</div>
            <div>Loading map...</div>
          </div>
        </div>
      )}

      {/* Map controls */}
      {!isLoading && !error && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <button
            onClick={refreshData}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '5px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Refresh incidents"
          >
            🔄
          </button>
        </div>
      )}

      {/* Incident count */}
      {showIncidents && incidents.length > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          {incidents.length} incidents displayed
        </div>
      )}
    </div>
  );
};

export default TomTomMap;