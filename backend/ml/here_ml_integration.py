"""
============================================================
TrafficWiz - HERE Maps ML Integration
============================================================
Purpose: Fetch HERE Maps real-time data and format it for ML predictions

Features:
- Fetch current traffic conditions from HERE Maps
- Extract features for ML model
- Combine with historical data for better predictions
============================================================
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from services.here_service import HereService
import pandas as pd
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HereMLIntegration:
    """Integrate HERE Maps live data with ML predictions"""
    
    def __init__(self, api_key: str):
        self.here = HereService(api_key)
        
    def fetch_current_traffic_features(self, bbox: str = "-87.0,36.0,-86.5,36.4"):
        """
        Fetch current traffic conditions and extract ML features
        
        Args:
            bbox: Bounding box for Nashville area
            
        Returns:
            dict: Features for ML model
        """
        try:
            # Get current incidents
            incidents_data = self.here.get_traffic_incidents(bbox=bbox)
            incidents = incidents_data.get('incidents', [])
            
            # Get traffic overview
            overview = self.here.get_nashville_traffic_overview()
            
            # Extract features
            features = {
                'timestamp': datetime.now(),
                'hour': datetime.now().hour,
                'day_of_week': datetime.now().weekday(),
                'active_incidents': len(incidents),
                'high_severity_incidents': sum(1 for i in incidents if i.get('severity', 0) >= 4),
                'medium_severity_incidents': sum(1 for i in incidents if 2 <= i.get('severity', 0) < 4),
                'low_severity_incidents': sum(1 for i in incidents if i.get('severity', 0) < 2),
            }
            
            # Add average traffic speeds if available
            if overview.get('traffic_flows'):
                speeds = [f.get('current_speed', 0) for f in overview['traffic_flows'] if f.get('current_speed')]
                if speeds:
                    features['avg_traffic_speed'] = sum(speeds) / len(speeds)
                    features['min_traffic_speed'] = min(speeds)
                else:
                    features['avg_traffic_speed'] = 0
                    features['min_traffic_speed'] = 0
            else:
                features['avg_traffic_speed'] = 0
                features['min_traffic_speed'] = 0
                
            return features
            
        except Exception as e:
            logger.error(f"Error fetching traffic features: {e}")
            return None
    
    def prepare_prediction_data(self, location: str = "Nashville"):
        """
        Prepare data for ML prediction using current HERE Maps data
        
        Args:
            location: Location name
            
        Returns:
            pd.DataFrame: Single row DataFrame ready for ML prediction
        """
        features = self.fetch_current_traffic_features()
        
        if not features:
            logger.warning("Could not fetch traffic features, using defaults")
            features = {
                'hour': datetime.now().hour,
                'day_of_week': datetime.now().weekday(),
                'active_incidents': 0,
                'high_severity_incidents': 0,
                'medium_severity_incidents': 0,
                'low_severity_incidents': 0,
                'avg_traffic_speed': 0,
                'min_traffic_speed': 0,
            }
        
        # Create DataFrame for prediction
        df = pd.DataFrame([{
            'location': location,
            'hour': features['hour'],
            'day_of_week': features['day_of_week'],
            'active_incidents': features['active_incidents'],
            'high_severity_count': features['high_severity_incidents'],
            'medium_severity_count': features['medium_severity_incidents'],
            'low_severity_count': features['low_severity_incidents'],
            'avg_speed_kmh': features['avg_traffic_speed'],
            'min_speed_kmh': features['min_traffic_speed'],
        }])
        
        return df
    
    def get_incident_likelihood(self):
        """
        Get likelihood of incidents based on current conditions
        
        Returns:
            dict: Incident risk assessment
        """
        features = self.fetch_current_traffic_features()
        
        if not features:
            return {'error': 'Could not fetch traffic data'}
        
        # Simple heuristic (can be replaced with trained ML model)
        risk_score = 0
        
        # More current incidents = higher risk
        risk_score += features['active_incidents'] * 2
        risk_score += features['high_severity_incidents'] * 5
        risk_score += features['medium_severity_incidents'] * 2
        
        # Slower traffic = higher risk
        if features['avg_traffic_speed'] < 30:  # km/h
            risk_score += 10
        elif features['avg_traffic_speed'] < 50:
            risk_score += 5
            
        # Rush hour = higher risk
        if features['hour'] in [7, 8, 9, 16, 17, 18]:
            risk_score += 3
            
        # Determine risk level
        if risk_score >= 20:
            risk_level = "High"
        elif risk_score >= 10:
            risk_level = "Medium"
        else:
            risk_level = "Low"
            
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'factors': features,
            'timestamp': datetime.now().isoformat()
        }


# Example usage
if __name__ == "__main__":
    # Initialize with your HERE API key
    API_KEY = os.getenv("HERE_API_KEY", "")
    
    integrator = HereMLIntegration(API_KEY)
    
    # Get current traffic features
    print("Fetching current traffic features...")
    features = integrator.fetch_current_traffic_features()
    print(f"Features: {features}")
    
    # Prepare data for ML prediction
    print("\nPreparing prediction data...")
    prediction_df = integrator.prepare_prediction_data()
    print(prediction_df)
    
    # Get incident likelihood
    print("\nCalculating incident likelihood...")
    risk = integrator.get_incident_likelihood()
    print(f"Risk Assessment: {risk}")
