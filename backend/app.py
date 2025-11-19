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

# TomTom API configuration
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "YOUR_TOMTOM_API_KEY_HERE")
TOMTOM_BASE_URL = "https://api.tomtom.com"

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
        cur.execute("SELECT id, date, description, severity, location FROM traffic_incidents ORDER BY id DESC LIMIT 100;")
        rows = cur.fetchall()
        # normalize severity number to string label for older frontend
        for r in rows:
            sev = r.get("severity")
            if isinstance(sev, int):
                if sev >= 4:
                    r["severity"] = "High"
                elif sev == 3:
                    r["severity"] = "Medium"
                else:
                    r["severity"] = "Low"
            else:
                r["severity"] = str(sev)
        cur.close()
        conn.close()
        return jsonify({"traffic_data": rows})
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
    """Return model prediction for posted JSON input."""
    try:
        payload = request.get_json()
        if not os.path.exists(MODEL_PATH):
            return jsonify({"error": "model.pkl not found"}), 404

        model = joblib.load(MODEL_PATH)
        df = pd.DataFrame([payload])
        y_pred = model.predict(df)[0]
        return jsonify({"prediction": float(y_pred)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Return the saved ML training metrics."""
    try:
        if not os.path.exists(METRICS_PATH):
            return jsonify({"error": "metrics.json not found"}), 404
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics = json.load(f)
        return jsonify(metrics)
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
# TomTom API Endpoints
# ============================================================

# Import TomTom service
try:
    from services.tomtom_service import TomTomService
    tomtom_service = TomTomService(TOMTOM_API_KEY)
except ImportError as e:
    logger.warning(f"TomTom service not available: {e}")
    tomtom_service = None

@app.route("/api/tomtom/traffic-flow", methods=["GET"])
def get_tomtom_traffic_flow():
    """Get real-time traffic flow data for a location"""
    if not tomtom_service:
        return jsonify({"error": "TomTom service not available"}), 503
    
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        zoom = int(request.args.get('zoom', 10))
        
        flow_data = tomtom_service.get_traffic_flow(lat, lon, zoom)
        return jsonify(flow_data)
    except (TypeError, ValueError) as e:
        return jsonify({"error": "Invalid lat/lon parameters"}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/tomtom/traffic-incidents", methods=["GET"])
def get_tomtom_traffic_incidents():
    """Get live traffic incidents in Nashville area"""
    if not tomtom_service:
        return jsonify({"error": "TomTom service not available"}), 503
    
    try:
        # Default to Nashville bounding box if not provided
        bbox = request.args.get('bbox', '-87.0,36.0,-86.5,36.4')
        category_filter = request.args.get('categories')
        
        if category_filter:
            category_filter = [int(x.strip()) for x in category_filter.split(',')]
        
        incidents = tomtom_service.get_traffic_incidents(bbox, category_filter)
        return jsonify({"incidents": incidents, "count": len(incidents)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/tomtom/route", methods=["POST"])
def calculate_tomtom_route():
    """Calculate optimal route using TomTom routing API"""
    if not tomtom_service:
        return jsonify({"error": "TomTom service not available"}), 503
    
    try:
        data = request.get_json()
        start = (data['start']['lat'], data['start']['lon'])
        end = (data['end']['lat'], data['end']['lon'])
        avoid_traffic = data.get('avoid_traffic', True)
        
        route_data = tomtom_service.calculate_route(start, end, avoid_traffic)
        return jsonify(route_data)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/tomtom/geocode", methods=["GET"])
def tomtom_geocode():
    """Geocode an address using TomTom search API"""
    if not tomtom_service:
        return jsonify({"error": "TomTom service not available"}), 503
    
    try:
        address = request.args.get('address')
        if not address:
            return jsonify({"error": "Address parameter required"}), 400
        
        results = tomtom_service.geocode_address(address)
        return jsonify({"results": results, "count": len(results)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/tomtom/nashville-overview", methods=["GET"])
def get_nashville_traffic_overview():
    """Get comprehensive traffic overview for Nashville"""
    if not tomtom_service:
        return jsonify({"error": "TomTom service not available"}), 503
    
    try:
        overview = tomtom_service.get_nashville_traffic_overview()
        return jsonify(overview)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================================
# Server runner
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
