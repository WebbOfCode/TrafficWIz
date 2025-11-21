"""
HERE API Data Collector Service
Fetches live traffic incident data from HERE API and stores it in the database
"""
import os
import sys
import time
import mysql.connector
import socket
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import here_service
sys.path.append(str(Path(__file__).parent.parent))

from services.here_service import HereService
from dotenv import load_dotenv

load_dotenv()

# Configure socket timeout for DNS resolution
socket.setdefaulttimeout(30)

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "trafficwiz_user"),
    "password": os.getenv("DB_PASSWORD", "StrongPass123!"),
    "database": os.getenv("DB_NAME", "trafficwiz"),
    "port": int(os.getenv("DB_PORT", "3306")),
}

# HERE API key
HERE_API_KEY = os.getenv("HERE_API_KEY", "_Y8zyahHf6R_i8_nllC1LjVeIQAySkuVSBpmm5LDaUU")

# Nashville area bounding box
NASHVILLE_BBOX = "-87.0,36.0,-86.5,36.4"  # west,south,east,north

class HereDataCollector:
    """Collects traffic incident data from HERE API and stores in database"""
    
    def __init__(self):
        self.here_service = HereService(HERE_API_KEY)
        self.db_config = DB_CONFIG
        
    def get_db_connection(self):
        """Create database connection"""
        return mysql.connector.connect(**self.db_config)
    
    def fetch_here_incidents(self):
        """Fetch incidents from HERE API"""
        try:
            print(f"[{datetime.now()}] Fetching incidents from HERE API...")
            result = self.here_service.get_traffic_incidents(bbox=NASHVILLE_BBOX)
            
            if 'error' in result:
                print(f"ERROR: {result['error']}")
                return []
            
            incidents = result.get('incidents', [])
            print(f"[{datetime.now()}] Fetched {len(incidents)} incidents from HERE API")
            return incidents
            
        except Exception as e:
            print(f"ERROR fetching HERE incidents: {e}")
            return []
    
    def save_incident_to_db(self, incident):
        """Save a single incident to database"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Extract incident data
            incident_id = incident.get('id', '')
            incident_type = incident.get('type', 'Unknown')
            severity = self._map_severity_to_enum(incident.get('severity', 'Low'))
            description = incident.get('description', f"{incident_type} incident")
            
            # Get location - try to get from/to coordinates
            from_point = incident.get('from', {})
            to_point = incident.get('to', {})
            
            # Use 'from' point if available, otherwise default to Nashville center
            if from_point and 'lat' in from_point:
                lat = from_point.get('lat', 36.1627)
                lon = from_point.get('lon', -86.7816)
            else:
                lat = 36.1627
                lon = -86.7816
            
            # Try to get location from HERE API 'location' field (street name)
            # If not available, fall back to description or coordinates
            location_str = incident.get('location', '')
            if not location_str or len(location_str) < 3:
                # Extract location from description if it contains "At " pattern
                if description and 'At ' in description:
                    # Split on " - " and take the location part
                    location_str = description.split(' - ')[0] if ' - ' in description else description
                else:
                    location_str = f"{lat},{lon}"
            
            # Get start time or use current time
            start_time = incident.get('startTime')
            if start_time:
                # Parse ISO format timestamp
                try:
                    incident_date = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                except:
                    incident_date = datetime.now()
            else:
                incident_date = datetime.now()
            
            # Check if incident already exists (avoid duplicates)
            cursor.execute(
                "SELECT id FROM traffic_incidents WHERE description = %s AND date = %s LIMIT 1",
                (description, incident_date)
            )
            
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return False  # Already exists
            
            # Insert new incident
            # Try with extended columns first, fall back to basic if columns don't exist
            try:
                insert_query = """
                    INSERT INTO traffic_incidents (date, location, severity, description, incident_type, latitude, longitude, here_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (
                    incident_date,
                    location_str,
                    severity,
                    description,
                    incident_type,
                    lat,
                    lon,
                    incident_id
                ))
            except mysql.connector.Error as e:
                # Fall back to basic columns if extended columns don't exist
                if "Unknown column" in str(e):
                    insert_query = """
                        INSERT INTO traffic_incidents (date, location, severity, description)
                        VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(insert_query, (
                        incident_date,
                        location_str,
                        severity,
                        description
                    ))
                else:
                    raise
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True  # Successfully inserted
            
        except mysql.connector.Error as e:
            print(f"Database error: {e}")
            return False
        except Exception as e:
            print(f"Error saving incident: {e}")
            return False
    
    def _map_severity_to_enum(self, severity_str):
        """Map severity string to ENUM ('Low', 'Medium', 'High')"""
        severity_map = {
            'Critical': 'High',
            'High': 'High',
            'Major': 'High',
            'Medium': 'Medium',
            'Moderate': 'Medium',
            'Low': 'Low',
            'Minor': 'Low',
            'Info': 'Low'
        }
        return severity_map.get(severity_str, 'Low')
    
    def collect_and_store(self):
        """Main method: Fetch incidents from HERE and store in database"""
        print(f"\n{'='*60}")
        print(f"HERE Data Collection Started at {datetime.now()}")
        print(f"{'='*60}")
        
        incidents = self.fetch_here_incidents()
        
        if not incidents:
            print("No incidents fetched from HERE API")
            return 0
        
        saved_count = 0
        for incident in incidents:
            if self.save_incident_to_db(incident):
                saved_count += 1
        
        print(f"[{datetime.now()}] Saved {saved_count} new incidents to database")
        print(f"{'='*60}\n")
        
        return saved_count
    
    def run_continuous(self, interval_minutes=10):
        """Run continuous data collection at specified interval"""
        print(f"Starting continuous HERE data collection (every {interval_minutes} minutes)")
        print(f"Monitoring Nashville area: {NASHVILLE_BBOX}")
        print(f"Database: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        print(f"Press Ctrl+C to stop\n")
        
        while True:
            try:
                self.collect_and_store()
                print(f"Sleeping for {interval_minutes} minutes...")
                time.sleep(interval_minutes * 60)
            except KeyboardInterrupt:
                print("\nStopping data collection...")
                break
            except Exception as e:
                print(f"ERROR in collection loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying


def main():
    """Main entry point for HERE data collector"""
    collector = HereDataCollector()
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--once':
            # Run once and exit
            collector.collect_and_store()
        elif sys.argv[1] == '--interval':
            # Run continuously with custom interval
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            collector.run_continuous(interval_minutes=interval)
        else:
            print("Usage:")
            print("  python here_data_collector.py           # Run continuously (10 min interval)")
            print("  python here_data_collector.py --once    # Run once and exit")
            print("  python here_data_collector.py --interval 15  # Run every 15 minutes")
    else:
        # Default: run continuously every 10 minutes
        collector.run_continuous(interval_minutes=10)


if __name__ == "__main__":
    main()
