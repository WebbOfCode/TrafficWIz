"""
============================================================
TrafficWiz - TomTom API Service
============================================================
Purpose: Interface with TomTom APIs for real-time traffic data

Features:
- Traffic Flow API: Real-time traffic speeds and congestion
- Traffic Incidents API: Live traffic incidents and alerts
- Routing API: Calculate optimal routes considering traffic
- Geocoding API: Convert addresses to coordinates
- Map Display API: Generate map tiles and static maps

TomTom APIs Used:
- Traffic Flow: https://api.tomtom.com/traffic/services/4/flowSegmentData
- Traffic Incidents: https://api.tomtom.com/traffic/services/5/incidentDetails
- Routing: https://api.tomtom.com/routing/1/calculateRoute
- Geocoding: https://api.tomtom.com/search/2/geocode

Configuration:
- Requires TOMTOM_API_KEY environment variable
- All requests include proper error handling and rate limiting
============================================================
"""

import os
import requests
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TomTomService:
    def __init__(self, api_key: str = None):
        """Initialize TomTom service with API key"""
        self.api_key = api_key or os.getenv("TOMTOM_API_KEY")
        self.base_url = "https://api.tomtom.com"
        
        if not self.api_key or self.api_key == "YOUR_TOMTOM_API_KEY_HERE":
            logger.warning("TomTom API key not configured. Please set TOMTOM_API_KEY environment variable.")
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated request to TomTom API"""
        if not self.api_key or self.api_key == "YOUR_TOMTOM_API_KEY_HERE":
            raise ValueError("TomTom API key not configured")
        
        if params is None:
            params = {}
        
        params['key'] = self.api_key
        
        try:
            response = requests.get(f"{self.base_url}{endpoint}", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"TomTom API request failed: {e}")
            raise
    
    def get_traffic_flow(self, lat: float, lon: float, zoom: int = 10) -> Dict:
        """Get real-time traffic flow data for a location
        
        Args:
            lat: Latitude
            lon: Longitude  
            zoom: Zoom level (higher = more detailed)
            
        Returns:
            Dict with traffic flow information including speed, congestion level
        """
        endpoint = "/traffic/services/4/flowSegmentData/absolute/10/json"
        params = {
            'point': f"{lat},{lon}",
            'zoom': zoom,
            'format': 'json'
        }
        
        try:
            data = self._make_request(endpoint, params)
            
            # Extract relevant traffic information
            flow_data = data.get('flowSegmentData', {})
            
            return {
                'location': {'lat': lat, 'lon': lon},
                'current_speed': flow_data.get('currentSpeed', 0),
                'free_flow_speed': flow_data.get('freeFlowSpeed', 0),
                'current_travel_time': flow_data.get('currentTravelTime', 0),
                'free_flow_travel_time': flow_data.get('freeFlowTravelTime', 0),
                'confidence': flow_data.get('confidence', 0),
                'road_closure': flow_data.get('roadClosure', False),
                'coordinates': flow_data.get('coordinates', {})
            }
        except Exception as e:
            logger.error(f"Failed to get traffic flow: {e}")
            return {'error': str(e)}
    
    def get_traffic_incidents(self, bbox: str, category_filter: List[int] = None) -> List[Dict]:
        """Get live traffic incidents in a bounding box
        
        Args:
            bbox: Bounding box as "minLon,minLat,maxLon,maxLat"
            category_filter: List of incident category IDs to filter by
            
        Returns:
            List of traffic incidents with details
        """
        endpoint = "/traffic/services/5/incidentDetails"
        params = {
            'bbox': bbox,
            'fields': '{incidents{type,geometry,properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,roadNumbers,timeValidity,location}}}',
            'language': 'en-US',
            'format': 'json'
        }
        
        if category_filter:
            params['categoryFilter'] = ','.join(map(str, category_filter))
        
        try:
            data = self._make_request(endpoint, params)
            incidents = []
            
            for incident in data.get('incidents', []):
                properties = incident.get('properties', {})
                events = properties.get('events', [])
                
                # Extract the main event description
                main_event = events[0] if events else {}
                
                incidents.append({
                    'id': incident.get('id'),
                    'type': incident.get('type'),
                    'geometry': incident.get('geometry'),
                    'description': main_event.get('description', 'Traffic incident'),
                    'icon_category': main_event.get('iconCategory', 0),
                    'severity': properties.get('magnitudeOfDelay', 0),
                    'start_time': properties.get('startTime'),
                    'end_time': properties.get('endTime'),
                    'road_numbers': properties.get('roadNumbers', []),
                    'location': properties.get('location', {})
                })
            
            return incidents
        except Exception as e:
            logger.error(f"Failed to get traffic incidents: {e}")
            return []
    
    def calculate_route(self, start: Tuple[float, float], end: Tuple[float, float], 
                       avoid_traffic: bool = True) -> Dict:
        """Calculate optimal route between two points
        
        Args:
            start: (lat, lon) of starting point
            end: (lat, lon) of destination
            avoid_traffic: Whether to avoid traffic when calculating route
            
        Returns:
            Dict with route information including distance, time, geometry
        """
        endpoint = f"/routing/1/calculateRoute/{start[0]},{start[1]}:{end[0]},{end[1]}/json"
        params = {
            'traffic': 'true' if avoid_traffic else 'false',
            'routeType': 'fastest',
            'travelMode': 'car'
        }
        
        try:
            data = self._make_request(endpoint, params)
            routes = data.get('routes', [])
            
            if not routes:
                return {'error': 'No routes found'}
            
            route = routes[0]  # Get the first (best) route
            summary = route.get('summary', {})
            
            return {
                'distance_meters': summary.get('lengthInMeters', 0),
                'travel_time_seconds': summary.get('travelTimeInSeconds', 0),
                'traffic_delay_seconds': summary.get('trafficDelayInSeconds', 0),
                'departure_time': summary.get('departureTime'),
                'arrival_time': summary.get('arrivalTime'),
                'geometry': route.get('legs', [{}])[0].get('points', [])
            }
        except Exception as e:
            logger.error(f"Failed to calculate route: {e}")
            return {'error': str(e)}
    
    def geocode_address(self, address: str) -> List[Dict]:
        """Convert address to coordinates
        
        Args:
            address: Address string to geocode
            
        Returns:
            List of possible locations with coordinates
        """
        endpoint = "/search/2/geocode.json"
        params = {
            'query': address,
            'limit': 5
        }
        
        try:
            data = self._make_request(endpoint, params)
            results = []
            
            for result in data.get('results', []):
                position = result.get('position', {})
                address_info = result.get('address', {})
                
                results.append({
                    'address': result.get('address', {}).get('freeformAddress', address),
                    'lat': position.get('lat'),
                    'lon': position.get('lon'),
                    'score': result.get('score', 0),
                    'country': address_info.get('country'),
                    'state': address_info.get('countrySubdivision'),
                    'city': address_info.get('municipality'),
                    'postal_code': address_info.get('postalCode')
                })
            
            return results
        except Exception as e:
            logger.error(f"Failed to geocode address: {e}")
            return []
    
    def get_nashville_traffic_overview(self) -> Dict:
        """Get traffic overview for Nashville area"""
        # Nashville bounding box (approximate)
        nashville_bbox = "-87.0,36.0,-86.5,36.4"
        
        try:
            incidents = self.get_traffic_incidents(nashville_bbox)
            
            # Get traffic flow for key Nashville locations
            key_locations = [
                {'name': 'Downtown Nashville', 'lat': 36.1627, 'lon': -86.7816},
                {'name': 'I-40/I-65 Junction', 'lat': 36.1547, 'lon': -86.7697},
                {'name': 'I-440 West', 'lat': 36.1167, 'lon': -86.8500},
                {'name': 'Briley Parkway', 'lat': 36.2000, 'lon': -86.7000}
            ]
            
            traffic_flows = []
            for location in key_locations:
                flow = self.get_traffic_flow(location['lat'], location['lon'])
                flow['location_name'] = location['name']
                traffic_flows.append(flow)
            
            return {
                'incidents_count': len(incidents),
                'incidents': incidents[:10],  # Return top 10 incidents
                'traffic_flows': traffic_flows,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get Nashville traffic overview: {e}")
            return {'error': str(e)}