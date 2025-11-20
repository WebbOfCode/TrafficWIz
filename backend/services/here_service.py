"""
HERE Maps API Service
Provides traffic flow, incidents, routing, and geocoding functionality
"""
import requests
from typing import Dict, List, Optional, Any

class HereService:
    """Service for interacting with HERE Maps APIs"""
    
    def __init__(self, api_key: str):
        """
        Initialize HERE service with API key
        
        Args:
            api_key: HERE API key
        """
        self.api_key = api_key
        self.base_url = "https://api.here.com"
        
    def get_traffic_flow(self, lat: float, lon: float, radius: int = 5000) -> Dict[str, Any]:
        """
        Get traffic flow data for a location
        
        Args:
            lat: Latitude
            lon: Longitude
            radius: Search radius in meters (default 5000)
            
        Returns:
            Traffic flow data with speed and congestion info
        """
        try:
            url = f"{self.base_url}/v8/flow/flow"
            params = {
                'apiKey': self.api_key,
                'in': f'circle:{lat},{lon};r={radius}',
                'locationReferencing': 'olr'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Transform HERE response to match TomTom format for compatibility
            flow_data = {
                'flowSegmentData': {
                    'coordinates': {'latitude': lat, 'longitude': lon},
                    'currentSpeed': self._extract_average_speed(data),
                    'freeFlowSpeed': self._extract_free_flow_speed(data),
                    'currentTravelTime': self._extract_travel_time(data),
                    'confidence': 0.95
                }
            }
            
            return flow_data
            
        except requests.exceptions.RequestException as e:
            return {'error': f'Failed to fetch traffic flow: {str(e)}'}
    
    def get_traffic_incidents(self, bbox: str = None, lat: float = None, lon: float = None, radius: int = 10000) -> Dict[str, Any]:
        """
        Get traffic incidents for an area
        
        Args:
            bbox: Bounding box as "west,south,east,north"
            lat: Center latitude (if not using bbox)
            lon: Center longitude (if not using bbox)
            radius: Search radius in meters (default 10000)
            
        Returns:
            List of traffic incidents with details
        """
        try:
            url = f"{self.base_url}/v8/incidents"
            
            params = {
                'apiKey': self.api_key,
                'locationReferencing': 'shape'
            }
            
            # Use bbox if provided, otherwise use center point with radius
            if bbox:
                params['in'] = f'bbox:{bbox}'
            elif lat and lon:
                params['in'] = f'circle:{lat},{lon};r={radius}'
            else:
                return {'error': 'Must provide either bbox or lat/lon'}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Transform HERE incidents to match TomTom format
            incidents = []
            for incident in data.get('results', []):
                incidents.append({
                    'id': incident.get('incidentDetails', {}).get('id'),
                    'type': self._map_incident_type(incident.get('incidentDetails', {}).get('type')),
                    'severity': self._map_severity(incident.get('incidentDetails', {}).get('criticality')),
                    'description': incident.get('incidentDetails', {}).get('description', {}).get('value', ''),
                    'from': incident.get('location', {}).get('shape', {}).get('links', [{}])[0].get('points', [{}])[0] if incident.get('location', {}).get('shape', {}).get('links') else {},
                    'to': incident.get('location', {}).get('shape', {}).get('links', [{}])[0].get('points', [{}])[-1] if incident.get('location', {}).get('shape', {}).get('links') else {},
                    'delay': incident.get('incidentDetails', {}).get('delaySeconds', 0),
                    'startTime': incident.get('incidentDetails', {}).get('startTime'),
                    'endTime': incident.get('incidentDetails', {}).get('endTime')
                })
            
            return {'incidents': incidents}
            
        except requests.exceptions.RequestException as e:
            return {'error': f'Failed to fetch traffic incidents: {str(e)}'}
    
    def calculate_route(self, origin: str, destination: str, departure_time: str = None) -> Dict[str, Any]:
        """
        Calculate route with traffic data
        
        Args:
            origin: Origin coordinates as "lat,lon"
            destination: Destination coordinates as "lat,lon"
            departure_time: ISO 8601 departure time (optional)
            
        Returns:
            Route with distance, duration, and traffic delays
        """
        try:
            url = f"{self.base_url}/v8/routes"
            
            params = {
                'apiKey': self.api_key,
                'transportMode': 'car',
                'origin': origin,
                'destination': destination,
                'return': 'summary,polyline,actions,instructions,travelSummary,turnByTurnActions'
            }
            
            if departure_time:
                params['departureTime'] = departure_time
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Transform HERE route to match TomTom format
            if data.get('routes'):
                route = data['routes'][0]
                sections = route.get('sections', [])
                
                total_distance = sum(s.get('travelSummary', {}).get('length', 0) for s in sections)
                total_duration = sum(s.get('travelSummary', {}).get('duration', 0) for s in sections)
                total_delay = sum(s.get('travelSummary', {}).get('trafficDelay', 0) for s in sections)
                
                return {
                    'routes': [{
                        'summary': {
                            'lengthInMeters': total_distance,
                            'travelTimeInSeconds': total_duration,
                            'trafficDelayInSeconds': total_delay,
                            'departureTime': departure_time
                        },
                        'legs': sections,
                        'sections': sections
                    }]
                }
            
            return {'error': 'No routes found'}
            
        except requests.exceptions.RequestException as e:
            return {'error': f'Failed to calculate route: {str(e)}'}
    
    def geocode_address(self, address: str) -> Dict[str, Any]:
        """
        Geocode an address to coordinates
        
        Args:
            address: Address string to geocode
            
        Returns:
            Geocoding results with coordinates
        """
        try:
            url = f"{self.base_url}/v1/geocode"
            
            params = {
                'apiKey': self.api_key,
                'q': address
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Transform HERE geocoding to match TomTom format
            results = []
            for item in data.get('items', []):
                position = item.get('position', {})
                results.append({
                    'position': {
                        'lat': position.get('lat'),
                        'lon': position.get('lng')
                    },
                    'address': item.get('address', {}),
                    'type': item.get('resultType'),
                    'score': item.get('scoring', {}).get('queryScore', 0)
                })
            
            return {'results': results}
            
        except requests.exceptions.RequestException as e:
            return {'error': f'Failed to geocode address: {str(e)}'}
    
    def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Reverse geocode coordinates to address
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Address information
        """
        try:
            url = f"{self.base_url}/v1/revgeocode"
            
            params = {
                'apiKey': self.api_key,
                'at': f'{lat},{lon}'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('items'):
                item = data['items'][0]
                return {
                    'address': item.get('address', {}),
                    'position': item.get('position', {})
                }
            
            return {'error': 'No address found'}
            
        except requests.exceptions.RequestException as e:
            return {'error': f'Failed to reverse geocode: {str(e)}'}
    
    def get_nashville_traffic_overview(self) -> Dict[str, Any]:
        """
        Get comprehensive traffic overview for Nashville, TN
        
        Returns:
            Combined traffic flow and incidents data for Nashville
        """
        # Nashville coordinates
        nashville_lat = 36.1627
        nashville_lon = -86.7816
        radius = 25000  # 25km radius to cover metro area
        
        # Get both flow and incidents
        flow_data = self.get_traffic_flow(nashville_lat, nashville_lon, radius)
        incidents_data = self.get_traffic_incidents(lat=nashville_lat, lon=nashville_lon, radius=radius)
        
        return {
            'location': 'Nashville, TN',
            'coordinates': {'lat': nashville_lat, 'lon': nashville_lon},
            'trafficFlow': flow_data,
            'incidents': incidents_data.get('incidents', []),
            'incidentCount': len(incidents_data.get('incidents', []))
        }
    
    # Helper methods for data transformation
    
    def _extract_average_speed(self, data: Dict) -> float:
        """Extract average speed from HERE flow data"""
        results = data.get('results', [])
        if results:
            speeds = [r.get('currentFlow', {}).get('speed', 0) for r in results]
            return sum(speeds) / len(speeds) if speeds else 0
        return 0
    
    def _extract_free_flow_speed(self, data: Dict) -> float:
        """Extract free flow speed from HERE flow data"""
        results = data.get('results', [])
        if results:
            speeds = [r.get('currentFlow', {}).get('freeFlowSpeed', 0) for r in results]
            return sum(speeds) / len(speeds) if speeds else 0
        return 0
    
    def _extract_travel_time(self, data: Dict) -> int:
        """Extract travel time from HERE flow data"""
        results = data.get('results', [])
        if results:
            times = [r.get('currentFlow', {}).get('traversalTime', 0) for r in results]
            return sum(times) if times else 0
        return 0
    
    def _map_incident_type(self, here_type: str) -> str:
        """Map HERE incident type to TomTom format"""
        type_mapping = {
            'ACCIDENT': 'ACCIDENT',
            'CONGESTION': 'JAM',
            'CONSTRUCTION': 'CONSTRUCTION',
            'ROAD_CLOSURE': 'ROAD_CLOSED',
            'ROAD_HAZARD': 'DANGEROUS_CONDITIONS',
            'WEATHER': 'WEATHER',
            'DISABLED_VEHICLE': 'BROKEN_DOWN_VEHICLE',
            'MASS_TRANSIT': 'MASS_TRANSIT',
            'PLANNED_EVENT': 'PLANNED_EVENT',
            'OTHER': 'OTHER'
        }
        return type_mapping.get(here_type, 'OTHER')
    
    def _map_severity(self, criticality: str) -> int:
        """Map HERE criticality to TomTom severity (0-4)"""
        severity_mapping = {
            'CRITICAL': 4,
            'MAJOR': 3,
            'MINOR': 2,
            'LOW': 1
        }
        return severity_mapping.get(criticality, 1)
