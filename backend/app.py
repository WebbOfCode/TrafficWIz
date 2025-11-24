# ============================================================
# TrafficWiz Backend - Main Flask Application
# ============================================================
# Purpose: REST API server for TrafficWiz application
# 
# Responsibilities:
# - Serve traffic incident data from MySQL database
# - Provide aggregation endpoints for dashboard and risk analysis
# - Host ML prediction endpoints (/predict, /metrics, /retrain)
# - Handle CORS for frontend dev server
# - DB health checks and connectivity validation
#
# Key Endpoints:
# - GET  /                           - Root health check
# - GET  /api/health                 - DB-aware health status
# - GET  /api/traffic                - List all incidents (paginated)
# - GET  /api/traffic/<id>           - Single incident details
# - GET  /api/incidents/by-severity  - Severity aggregation
# - GET  /api/incidents/by-location  - Location aggregation  
# - GET  /api/incidents/by-day       - Time-series aggregation
# - POST /predict                    - ML prediction endpoint
# - GET  /metrics                    - Return ML training metrics
# - POST /retrain                    - Trigger model retraining
#
# Configuration:
# - Uses environment variables for DB credentials (see .env)
# - Default port: 5000
# - CORS enabled for frontend development
# ============================================================

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import pandas as pd
import joblib
import pickle
import traceback
from datetime import datetime
import mysql.connector
import requests

# ============================================================
# App configuration
# ============================================================

app = Flask(__name__)
CORS(app)

# Database configuration (update if needed)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "trafficwiz_user"),
    "password": os.getenv("DB_PASSWORD", "StrongPass123!"),
    # default DB name from schema.sql is `trafficwiz`
    "database": os.getenv("DB_NAME", "trafficwiz")
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "ml", "metrics.json")

# HERE Maps API configuration
HERE_API_KEY = os.getenv("HERE_API_KEY", "_Y8zyahHf6R_i8_nllC1LjVeIQAySkuVSBpmm5LDaUU")
HERE_BASE_URL = "https://data.traffic.hereapi.com"

# ============================================================
# Utility: connect to MySQL
# ============================================================

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# ============================================================
# Base routes
# ============================================================

@app.route("/")
def home():
    return jsonify({"message": "TrafficWiz Backend Active", "time": datetime.now().isoformat()})


@app.route('/api/health', methods=['GET'])
def api_health():
    """Return simple health and DB connectivity status."""
    status = {"service": "ok", "db": "unknown"}
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
        conn.close()
        status["db"] = "ok"
    except Exception as e:
        traceback.print_exc()
        status["db"] = f"error: {str(e)}"
    return jsonify(status)


@app.route("/incidents", methods=["GET"])
def get_incidents():
    """Return traffic incident data from the DB."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        # read from traffic_incidents (seed scripts write here)
        cur.execute("SELECT id, date, location, severity, description FROM traffic_incidents ORDER BY id DESC LIMIT 100;")
        data = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/risk", methods=["GET"])
def get_risk():
    """Return computed risk data if present in DB."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM risk_summary ORDER BY id DESC LIMIT 50;")
        data = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --- Compatibility endpoints expected by the frontend (Vite app)
@app.route("/api/traffic", methods=["GET"])
def api_traffic():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        
        # Get limit from query parameter (default 100, max 1000)
        limit = min(int(request.args.get('limit', 100)), 1000)
        
        cur.execute(f"SELECT id, date, description, severity, location FROM traffic_incidents ORDER BY id DESC LIMIT {limit};")
        rows = cur.fetchall()
        
        # Debug: Check what we're getting from database
        if rows:
            print(f"[DEBUG] Returning {len(rows)} incidents. Sample severity: {repr(rows[0].get('severity'))} (type: {type(rows[0].get('severity'))})")
        
        # The database returns severity as ENUM strings: 'Low', 'Medium', 'High'
        # No normalization needed - just ensure it's a string
        for r in rows:
            sev = r.get("severity")
            # Keep the severity as-is since database already has correct ENUM values
            if sev is None:
                r["severity"] = "Low"
            else:
                r["severity"] = str(sev)
        
        cur.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/traffic/<int:incident_id>", methods=["GET"])
def api_traffic_incident(incident_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, date, description, severity, location FROM traffic_incidents WHERE id = %s LIMIT 1;", (incident_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404
        sev = row.get("severity")
        if isinstance(sev, int):
            row["severity"] = "High" if sev >= 4 else ("Medium" if sev == 3 else "Low")
        cur.close()
        conn.close()
        return jsonify({"incident": row})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# Aggregation endpoints used by the frontend
@app.route('/api/incidents/by-severity', methods=['GET'])
def api_incidents_by_severity():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT severity, COUNT(*) AS count
            FROM traffic_incidents
            GROUP BY severity
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"by_severity": rows})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/incidents/by-location', methods=['GET'])
def api_incidents_by_location():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT location, COUNT(*) AS count
            FROM traffic_incidents
            GROUP BY location
            ORDER BY count DESC
            LIMIT 5
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"by_location": rows})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/incidents/by-day', methods=['GET'])
def api_incidents_by_day():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT DATE(date) AS day, COUNT(*) AS count
            FROM traffic_incidents
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"by_day": rows})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ============================================================
# Machine Learning Endpoints (from Role D)
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():
    """Predict incident severity for given road and time."""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        if not os.path.exists(MODEL_PATH):
            return jsonify({"error": "model.pkl not found. Run train_model.py first."}), 404

        # Safely load model with error handling
        try:
            model_data = joblib.load(MODEL_PATH)
            model = model_data['model']
            feature_names = model_data['feature_names']
        except (EOFError, pickle.PickleError, KeyError, joblib.externals.loky.process_executor.TerminatedWorkerError) as e:
            return jsonify({"error": f"Model file corrupted: {str(e)}. Please retrain the model."}), 500
            
        # Create dataframe with all features
        df = pd.DataFrame([payload])
        
        # Limit dataframe size to prevent memory issues
        if len(df.columns) > 50 or len(df) > 10:
            return jsonify({"error": "Payload too large"}), 400
        
        # Ensure all expected features are present
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        
        # Reorder columns to match training
        df = df[feature_names]
        
        # Predict
        y_pred = model.predict(df)[0]
        y_proba = model.predict_proba(df)[0]
        
        return jsonify({
            "prediction": str(y_pred),
            "probabilities": {
                "Low": float(y_proba[0]) if len(y_proba) > 0 else 0,
                "Medium": float(y_proba[1]) if len(y_proba) > 1 else 0,
                "High": float(y_proba[2]) if len(y_proba) > 2 else 0
            }
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)[:100]}"}), 500


@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Return the saved ML training metrics."""
    try:
        if not os.path.exists(METRICS_PATH):
            return jsonify({
                "error": "metrics.json not found. Run train_model.py first.",
                "accuracy": 0,
                "precision": 0,
                "recall": 0,
                "f1_score": 0
            }), 200  # Return 200 with fallback data instead of 404
            
        # Check file size to prevent loading huge files
        file_size = os.path.getsize(METRICS_PATH)
        if file_size > 1024 * 1024:  # 1MB limit
            return jsonify({"error": "Metrics file too large"}), 500
            
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics = json.load(f)
            
        # Validate metrics structure to prevent frontend crashes
        required_keys = ['accuracy', 'precision', 'recall', 'f1_score']
        for key in required_keys:
            if key not in metrics:
                metrics[key] = 0
                
        return jsonify(metrics)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        return jsonify({
            "error": f"Invalid metrics file: {str(e)}",
            "accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1_score": 0
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to load metrics: {str(e)[:100]}"}), 500


@app.route("/road-analysis", methods=["GET"])
def get_road_analysis():
    """Return best/worst travel times for each road."""
    try:
        road_analysis_path = os.path.join(os.path.dirname(__file__), "ml", "road_analysis.json")
        if not os.path.exists(road_analysis_path):
            # Return empty analysis instead of 404 to prevent frontend crashes
            return jsonify({
                "message": "Road analysis not available. Run train_model.py to generate data."
            }), 200
        
        # Check file size
        file_size = os.path.getsize(road_analysis_path)
        if file_size > 5 * 1024 * 1024:  # 5MB limit
            return jsonify({"error": "Road analysis file too large"}), 500
            
        with open(road_analysis_path, "r", encoding="utf-8") as f:
            analysis = json.load(f)
            
        # Ensure we return valid structure even if file is malformed
        if not isinstance(analysis, dict):
            return jsonify({"message": "Invalid road analysis data"}), 200
            
        return jsonify(analysis)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        return jsonify({
            "error": f"Invalid road analysis file: {str(e)}"
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Failed to load road analysis: {str(e)[:100]}"
        }), 200


@app.route("/best-time/<path:road>", methods=["GET"])
def get_best_time(road):
    """Get best travel times for a specific road."""
    try:
        road_analysis_path = os.path.join(os.path.dirname(__file__), "ml", "road_analysis.json")
        if not os.path.exists(road_analysis_path):
            return jsonify({"error": "road_analysis.json not found"}), 404
        
        with open(road_analysis_path, "r", encoding="utf-8") as f:
            analysis = json.load(f)
        
        if road not in analysis:
            return jsonify({"error": f"Road '{road}' not found in analysis"}), 404
        
        return jsonify(analysis[road])
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/retrain", methods=["POST"])
def retrain_model():
    """Retrain the ML model (if script available)."""
    try:
        import subprocess
        train_script = os.path.join(os.path.dirname(__file__), "ml", "train_model.py")
        if not os.path.exists(train_script):
            return jsonify({"error": "train_model.py not found"}), 404

        result = subprocess.run(["python", train_script], capture_output=True, text=True)
        return jsonify({
            "message": "Retraining complete",
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================================
# HERE Maps API Endpoints
# ============================================================

# ============================================================
# HERE API Ingestion Pipeline
# ============================================================

# Import HERE service with enhanced error handling
try:
    from services.here_service import HereService
    # Only initialize if API key exists and is valid
    if HERE_API_KEY and HERE_API_KEY != "" and len(HERE_API_KEY) > 10:
        here_service = HereService(HERE_API_KEY)
        print("✅ HERE Maps service initialized successfully")
    else:
        print("⚠️ HERE API key not configured, using fallback data")
        here_service = None
except (ImportError, Exception) as e:
    print(f"⚠️ HERE service not available: {e}")
    here_service = None

def ingest_here_incidents_to_db():
    """
    Fetch live HERE incidents and store them in MySQL database.
    Prevents duplicates using external_id (HERE incident ID).
    
    Returns:
        dict: Status summary with counts of new/updated/skipped incidents
    """
    if not here_service:
        return {
            "status": "error",
            "message": "HERE service not available",
            "new": 0,
            "updated": 0,
            "skipped": 0
        }
    
    try:
        # Fetch incidents from HERE API for Nashville area
        # Using bounding box for Nashville metropolitan area
        incidents_data = here_service.get_traffic_incidents(
            lat=36.1627,
            lon=-86.7816,
            radius=25000  # 25km radius
        )
        
        if 'error' in incidents_data:
            return {
                "status": "error",
                "message": incidents_data['error'],
                "new": 0,
                "updated": 0,
                "skipped": 0
            }
        
        incidents = incidents_data.get('incidents', [])
        
        if not incidents:
            return {
                "status": "success",
                "message": "No incidents found in Nashville area",
                "new": 0,
                "updated": 0,
                "skipped": 0
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        new_count = 0
        updated_count = 0
        skipped_count = 0
        
        for incident in incidents:
            external_id = incident.get('id')
            if not external_id:
                # Generate a unique ID if HERE doesn't provide one
                external_id = f"here_{incident.get('type', 'unknown')}_{incident.get('location', 'unknown')[:50]}_{incident.get('startTime', '')}"
            
            # Extract location coordinates
            from_point = incident.get('from', {})
            latitude = from_point.get('lat') or from_point.get('latitude')
            longitude = from_point.get('lon') or from_point.get('lng') or from_point.get('longitude')
            
            # Map HERE severity (1-4) to our severity labels
            severity_num = incident.get('severity', 2)
            if severity_num == 4:
                severity = 'High'
            elif severity_num == 3:
                severity = 'Medium'
            else:
                severity = 'Low'
            
            # Parse start time
            start_time = incident.get('startTime')
            if start_time:
                # HERE uses ISO 8601 format, MySQL can handle it
                date = start_time
            else:
                date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Parse end time
            end_time = incident.get('endTime')
            
            # Extract other fields
            location = incident.get('location', 'Unknown Location')
            incident_type = incident.get('type', 'Traffic Incident')
            description = incident.get('description', '')
            delay_seconds = incident.get('delay', 0)
            
            # Check if incident already exists
            cur.execute(
                "SELECT id FROM traffic_incidents WHERE external_id = %s",
                (external_id,)
            )
            existing = cur.fetchone()
            
            if existing:
                # Update existing incident
                cur.execute("""
                    UPDATE traffic_incidents 
                    SET date = %s, location = %s, latitude = %s, longitude = %s,
                        severity = %s, incident_type = %s, description = %s,
                        delay_seconds = %s, end_time = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE external_id = %s
                """, (date, location, latitude, longitude, severity, incident_type, 
                      description, delay_seconds, end_time, external_id))
                updated_count += 1
            else:
                # Insert new incident
                try:
                    cur.execute("""
                        INSERT INTO traffic_incidents 
                        (external_id, date, location, latitude, longitude, severity, 
                         incident_type, description, delay_seconds, end_time)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (external_id, date, location, latitude, longitude, severity,
                          incident_type, description, delay_seconds, end_time))
                    new_count += 1
                except mysql.connector.IntegrityError:
                    # Duplicate key - skip
                    skipped_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "status": "success",
            "message": f"Ingestion complete: {new_count} new, {updated_count} updated, {skipped_count} skipped",
            "new": new_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_incidents": len(incidents)
        }
        
    except Exception as e:
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Ingestion failed: {str(e)}",
            "new": 0,
            "updated": 0,
            "skipped": 0
        }

@app.route("/api/refresh-incidents", methods=["GET", "POST"])
def refresh_incidents():
    """
    Trigger ingestion of live HERE traffic incidents into the database.
    This endpoint replaces any seed data logic with real-time HERE API data.
    
    Returns:
        JSON: Ingestion status with counts
    """
    result = ingest_here_incidents_to_db()
    
    if result["status"] == "error":
        return jsonify(result), 500
    
    return jsonify(result), 200

# ============================================================
# HERE Maps API Proxy Endpoints (DO NOT MODIFY - Ben's code)
# ============================================================

@app.route("/api/here/traffic-flow", methods=["GET"])
def get_here_traffic_flow():
    """Get real-time traffic flow data for a location"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        radius = int(request.args.get('radius', 5000))
        
        flow_data = here_service.get_traffic_flow(lat, lon, radius)
        return jsonify(flow_data)
    except (TypeError, ValueError) as e:
        return jsonify({"error": "Invalid lat/lon parameters"}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/here/traffic-incidents", methods=["GET"])
def get_here_traffic_incidents():
    """Get live traffic incidents in Nashville area"""
    if not here_service:
        # Return empty incident data instead of error to prevent frontend crashes
        return jsonify({
            "incidents": [], 
            "count": 0,
            "message": "HERE service not available - using fallback data"
        })
    
    try:
        # Default to Nashville bounding box if not provided
        bbox = request.args.get('bbox', '-87.0,36.0,-86.5,36.4')
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        radius = min(int(request.args.get('radius', 10000)), 25000)  # Cap radius to prevent large requests
        
        # Use threading timeout (works on both Windows and Unix)
        from threading import Thread, Event
        
        result_container = {'data': None, 'error': None}
        timeout_event = Event()
        
        def fetch_incidents():
            try:
                if lat and lon:
                    result_container['data'] = here_service.get_traffic_incidents(lat=float(lat), lon=float(lon), radius=radius)
                else:
                    result_container['data'] = here_service.get_traffic_incidents(bbox=bbox)
            except Exception as e:
                result_container['error'] = str(e)
            finally:
                timeout_event.set()
        
        # Start fetch in background thread with 5-second timeout
        fetch_thread = Thread(target=fetch_incidents, daemon=True)
        fetch_thread.start()
        fetch_thread.join(timeout=5.0)  # Wait max 5 seconds
        
        # Check if thread completed
        if not timeout_event.is_set():
            # Timeout occurred
            return jsonify({"incidents": [], "count": 0, "message": "HERE API timeout - try again later"})
        
        # Check for errors
        if result_container['error']:
            return jsonify({
                "incidents": [], 
                "count": 0, 
                "message": f"HERE API error: {result_container['error'][:100]}"
            })
        
        # Process successful result
        incidents_data = result_container['data']
        if isinstance(incidents_data, dict) and 'incidents' in incidents_data:
            incidents = incidents_data['incidents'][:50]  # Limit to 50 incidents max
            return jsonify({"incidents": incidents, "count": len(incidents)})
        else:
            return jsonify({"incidents": [], "count": 0, "message": "No incident data available"})
            
    except Exception as e:
        traceback.print_exc()
        # Return empty data instead of error to prevent frontend crash
        return jsonify({
            "incidents": [], 
            "count": 0, 
            "message": f"Error fetching incidents: {str(e)[:100]}"
        })

@app.route("/api/here/route", methods=["POST"])
def calculate_here_route():
    """Calculate optimal route using HERE routing API"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        data = request.get_json()
        
        # Handle both string coordinates and object format
        start = data['start']
        end = data['end']
        
        if isinstance(start, str):
            origin = start
        else:
            origin = f"{start['lat']},{start['lon']}"
            
        if isinstance(end, str):
            destination = end
        else:
            destination = f"{end['lat']},{end['lon']}"
        
        departure_time = data.get('departure_time')
        
        route_data = here_service.calculate_route(origin, destination, departure_time)
        return jsonify(route_data)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/here/geocode", methods=["GET"])
def here_geocode():
    """Geocode an address using HERE geocoding API"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        address = request.args.get('address')
        if not address:
            return jsonify({"error": "Address parameter required"}), 400
        
        geocode_data = here_service.geocode_address(address)
        results = geocode_data.get('results', [])
        return jsonify({"results": results, "count": len(results)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/here/nashville-overview", methods=["GET"])
def get_nashville_traffic_overview():
    """Get comprehensive traffic overview for Nashville"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        overview = here_service.get_nashville_traffic_overview()
        return jsonify(overview)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/here/ml/risk-assessment", methods=["GET"])
def get_here_ml_risk():
    """Get ML-based incident risk assessment using live HERE data"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        from ml.here_ml_integration import HereMLIntegration
        
        integrator = HereMLIntegration(HERE_API_KEY)
        risk_assessment = integrator.get_incident_likelihood()
        
        return jsonify(risk_assessment)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/here/ml/prediction-features", methods=["GET"])
def get_here_prediction_features():
    """Get current traffic features formatted for ML predictions"""
    if not here_service:
        return jsonify({"error": "HERE service not available"}), 503
    
    try:
        from ml.here_ml_integration import HereMLIntegration
        
        integrator = HereMLIntegration(HERE_API_KEY)
        features = integrator.fetch_current_traffic_features()
        
        if features:
            return jsonify(features)
        else:
            return jsonify({"error": "Could not fetch traffic features"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================================
# Server runner
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
