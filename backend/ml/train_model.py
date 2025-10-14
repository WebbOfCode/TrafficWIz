"""
============================================================
TrafficWiz - ML Model Training Script
============================================================
Purpose: Analyze traffic incident patterns to predict best/worst travel times

Features:
- Fetches real incident data from MySQL database
- Analyzes patterns by:
  - Road/location
  - Time of day (hour)
  - Day of week
  - Severity levels
- Trains model to predict risk score for road + time combinations
- Identifies safest and most dangerous travel times per road

Outputs:
- model.pkl: Trained model for risk prediction
- metrics.json: Performance metrics + best/worst times analysis
- road_analysis.json: Per-road travel time recommendations

Usage:
  python train_model.py

Note: Requires MySQL database with traffic_incidents table populated
============================================================
"""

import json
import joblib
import pandas as pd
import os
import sys
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, classification_report
from sklearn.ensemble import RandomForestClassifier
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

import mysql.connector

MODEL_PATH = Path(__file__).parent / "model.pkl"
METRICS_PATH = Path(__file__).parent / "metrics.json"
ROAD_ANALYSIS_PATH = Path(__file__).parent / "road_analysis.json"

def get_db_connection():
    """Connect to MySQL database"""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "trafficwiz_user"),
        password=os.getenv("DB_PASSWORD", "StrongPass123!"),
        database=os.getenv("DB_NAME", "trafficwiz"),
        port=int(os.getenv("DB_PORT", "3306"))
    )

def fetch_incident_data():
    """Fetch all traffic incidents from database"""
    print("📊 Fetching incident data from database...")
    conn = get_db_connection()
    
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
    
    print(f"✅ Loaded {len(df)} incidents")
    return df

def extract_features(df):
    """Extract ML features from incident data"""
    print("🔧 Extracting features...")
    
    # Parse datetime features
    df['date'] = pd.to_datetime(df['date'])
    df['hour'] = df['date'].dt.hour
    df['day_of_week'] = df['date'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 16, 17, 18]).astype(int)
    
    # Extract road from location (first part before comma)
    df['road'] = df['location'].str.split(',').str[0].str.strip()
    
    # Map severity to numeric risk score
    severity_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['severity_score'] = df['severity'].map(severity_map).fillna(1)
    
    return df

def analyze_road_patterns(df):
    """Analyze best/worst times for each road"""
    print("📈 Analyzing road patterns...")
    
    road_analysis = {}
    
    for road in df['road'].unique():
        road_data = df[df['road'] == road]
        
        # Count incidents by hour
        hourly_counts = road_data.groupby('hour').agg({
            'id': 'count',
            'severity_score': 'mean'
        }).rename(columns={'id': 'incident_count', 'severity_score': 'avg_severity'})
        
        # Calculate risk score (incidents * avg_severity)
        hourly_counts['risk_score'] = hourly_counts['incident_count'] * hourly_counts['avg_severity']
        
        # Find best and worst hours
        if len(hourly_counts) > 0:
            best_hours = hourly_counts.nsmallest(3, 'risk_score').index.tolist()
            worst_hours = hourly_counts.nlargest(3, 'risk_score').index.tolist()
            
            # Day of week analysis
            day_counts = road_data.groupby('day_of_week').size()
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            best_day = day_names[day_counts.idxmin()] if len(day_counts) > 0 else "Unknown"
            worst_day = day_names[day_counts.idxmax()] if len(day_counts) > 0 else "Unknown"
            
            road_analysis[road] = {
                'total_incidents': int(len(road_data)),
                'avg_severity': float(road_data['severity_score'].mean()),
                'best_hours': [int(h) for h in best_hours],
                'worst_hours': [int(h) for h in worst_hours],
                'best_day': best_day,
                'worst_day': worst_day,
                'rush_hour_incidents': int(road_data[road_data['is_rush_hour'] == 1].shape[0]),
                'weekend_incidents': int(road_data[road_data['is_weekend'] == 1].shape[0])
            }
    
    # Sort by total incidents
    road_analysis = dict(sorted(road_analysis.items(), 
                                key=lambda x: x[1]['total_incidents'], 
                                reverse=True))
    
    print(f"✅ Analyzed {len(road_analysis)} roads")
    return road_analysis

def train_model(df):
    """Train ML model to predict incident severity based on time/location"""
    print("🤖 Training ML model...")
    
    # Prepare features
    feature_cols = ['hour', 'day_of_week', 'is_weekend', 'is_rush_hour']
    target_col = 'severity'
    
    # Encode road names
    road_encoded = pd.get_dummies(df['road'], prefix='road')
    X = pd.concat([df[feature_cols], road_encoded], axis=1)
    y = df[target_col]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest Classifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = (y_pred == y_test).mean()
    
    # Feature importance
    feature_importance = dict(zip(X.columns, model.feature_importances_))
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
    
    metrics = {
        "model_type": "RandomForestClassifier",
        "accuracy": float(accuracy),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "features": feature_cols,
        "target": target_col,
        "classes": list(y.unique()),
        "top_features": [{"name": k, "importance": float(v)} for k, v in top_features],
        "trained_at": datetime.now().isoformat()
    }
    
    print(f"✅ Model Accuracy: {accuracy:.2%}")
    
    return model, metrics, X.columns.tolist()

def main():
    """Main training pipeline"""
    print("=" * 60)
    print("TrafficWiz ML Training Pipeline")
    print("=" * 60)
    
    # Fetch data
    df = fetch_incident_data()
    
    if len(df) == 0:
        print("❌ No incident data found. Please seed the database first.")
        return
    
    # Extract features
    df = extract_features(df)
    
    # Analyze patterns
    road_analysis = analyze_road_patterns(df)
    
    # Train model
    model, metrics, feature_names = train_model(df)
    
    # Save outputs
    print("\n💾 Saving outputs...")
    
    # Save model
    joblib.dump({
        'model': model,
        'feature_names': feature_names
    }, MODEL_PATH)
    print(f"✅ Model saved to {MODEL_PATH}")
    
    # Save metrics
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"✅ Metrics saved to {METRICS_PATH}")
    
    # Save road analysis
    with open(ROAD_ANALYSIS_PATH, 'w') as f:
        json.dump(road_analysis, f, indent=2)
    print(f"✅ Road analysis saved to {ROAD_ANALYSIS_PATH}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TRAINING SUMMARY")
    print("=" * 60)
    print(f"Total Incidents Analyzed: {len(df)}")
    print(f"Roads Analyzed: {len(road_analysis)}")
    print(f"Model Accuracy: {metrics['accuracy']:.2%}")
    print(f"\nTop 3 Most Dangerous Roads:")
    for i, (road, data) in enumerate(list(road_analysis.items())[:3], 1):
        print(f"  {i}. {road} - {data['total_incidents']} incidents")
    print("\n✅ Training complete!")

if __name__ == "__main__":
    main()