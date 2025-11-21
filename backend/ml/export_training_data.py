"""
============================================================
TrafficWiz - Data Export for ML Training
============================================================
Purpose: Export HERE API incident data to CSV for ML model training

Features:
- Fetches incidents from traffic_incidents table
- Extracts features: datetime, location, severity, type
- Aggregates historical patterns
- Exports to traffic_data.csv for model training

Usage:
  python export_training_data.py
============================================================
"""

import os
import sys
import pandas as pd
import mysql.connector
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "trafficwiz_user"),
    "password": os.getenv("DB_PASSWORD", "StrongPass123!"),
    "database": os.getenv("DB_NAME", "trafficwiz"),
    "port": int(os.getenv("DB_PORT", "3306")),
}

OUTPUT_FILE = Path(__file__).parent / "traffic_data.csv"

def get_db_connection():
    """Create database connection"""
    return mysql.connector.connect(**DB_CONFIG)

def export_traffic_data():
    """Export traffic incidents to CSV for ML training"""
    print(f"[{datetime.now()}] Exporting traffic data for ML training...")
    
    conn = get_db_connection()
    
    # Fetch all incident data with extended columns if available
    query = """
        SELECT 
            id,
            date,
            location,
            severity,
            description,
            incident_type,
            latitude,
            longitude,
            here_id,
            created_at
        FROM traffic_incidents
        ORDER BY date DESC
    """
    
    try:
        df = pd.read_sql(query, conn)
    except Exception as e:
        # Fall back to basic columns if extended columns don't exist
        print(f"Extended columns not found, using basic columns: {e}")
        query = """
            SELECT 
                id,
                date,
                location,
                severity,
                description
            FROM traffic_incidents
            ORDER BY date DESC
        """
        df = pd.read_sql(query, conn)
    
    conn.close()
    
    if len(df) == 0:
        print("⚠️  No data found in database!")
        return
    
    print(f"✅ Fetched {len(df)} incidents from database")
    
    # Feature engineering
    print("🔧 Extracting features...")
    
    # Parse datetime
    df['date'] = pd.to_datetime(df['date'])
    df['hour'] = df['date'].dt.hour
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 16, 17, 18]).astype(int)
    
    # Extract road name from location
    df['road'] = df['location'].str.split(',').str[0].str.strip()
    
    # Map severity to numeric
    severity_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['severity_numeric'] = df['severity'].map(severity_map).fillna(1)
    
    # Parse lat/lon from location if not in dedicated columns
    if 'latitude' not in df.columns or df['latitude'].isna().all():
        # Try to extract from location string (format: "lat,lon")
        location_parts = df['location'].str.split(',', n=2, expand=True)
        df['latitude'] = pd.to_numeric(location_parts[0], errors='coerce')
        df['longitude'] = pd.to_numeric(location_parts[1], errors='coerce')
    
    # Fill missing lat/lon with Nashville center
    df['latitude'] = df['latitude'].fillna(36.1627)
    df['longitude'] = df['longitude'].fillna(-86.7816)
    
    # Export to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"✅ Exported {len(df)} incidents to {OUTPUT_FILE}")
    print(f"\nDataset summary:")
    print(f"  - Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  - Severity distribution:")
    print(df['severity'].value_counts())
    if 'incident_type' in df.columns:
        print(f"  - Incident types:")
        print(df['incident_type'].value_counts().head())
    print(f"  - Unique locations: {df['road'].nunique()}")
    
    return df

def main():
    """Main entry point"""
    print("="*60)
    print("TrafficWiz ML Training Data Export")
    print("="*60)
    
    export_traffic_data()
    
    print("\n✅ Data export complete!")
    print(f"Use this data to train the model with: python train_model.py")

if __name__ == "__main__":
    main()
