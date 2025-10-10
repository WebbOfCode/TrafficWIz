import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

import mysql.connector
from mysql.connector import Error

import numpy as np
import pandas as pd
from joblib import load as joblib_load

# Load environment variables from .env
load_dotenv()

# -----------------
# Model / Features
# -----------------
FEATURES = ["accidents", "avg_speed"]  # <-- adjust if your model uses different features
MODEL_PATH = Path(__file__).parent / "ml" / "model.pkl"


# -----------------
# Database Connection
# -----------------
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            user=os.getenv("DB_USER", "trafficwiz_user"),
            password=os.getenv("DB_PASSWORD", "StrongPass123!"),
            database=os.getenv("DB_NAME", "trafficwiz"),
            port=int(os.getenv("DB_PORT", "3306")),
        )
        return conn
    except Error as e:
        print(f"MySQL connection error: {e}")
        return None


# -----------------
# Flask App Factory
# -----------------
def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ---- Load ML model once (non-fatal if missing so the API can still run) ----
    try:
        app.model = joblib_load(MODEL_PATH)
        app.logger.info(f"Loaded ML model from {MODEL_PATH}")
    except Exception as e:
        app.model = None
        app.logger.warning(f"Could not load model at {MODEL_PATH}: {e}")

    # -----------------
    # Health & basic routes
    # -----------------
    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "TrafficWiz API",
            "model_loaded": app.model is not None
        })

    @app.get("/api/demo")
    def demo():
        return jsonify({"message": "This is a demo endpoint"})

    @app.get("/api/hello")
    def hello():
        return jsonify({"message": "Hello from TrafficWiz API!"})

    @app.post("/api/echo")
    def echo():
        data = request.get_json(silent=True) or {}
        return jsonify({"you_sent": data})

    # -----------------
    # Core Data Endpoints
    # -----------------
    @app.get("/api/traffic")
    def traffic():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = None
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT id, date, location, severity, description
                FROM traffic_incidents
                ORDER BY date DESC
                LIMIT 100
            """)
            rows = cur.fetchall()
            return jsonify({"traffic_data": rows})
        except Error as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if cur: cur.close()
            conn.close()

    @app.get("/api/incidents/by-severity")
    def incidents_by_severity():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = None
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT severity, COUNT(*) as count
                FROM traffic_incidents
                GROUP BY severity
            """)
            rows = cur.fetchall()
            return jsonify({"by_severity": rows})
        except Error as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if cur: cur.close()
            conn.close()

    @app.get("/api/incidents/by-location")
    def incidents_by_location():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = None
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT location, COUNT(*) as count
                FROM traffic_incidents
                GROUP BY location
                ORDER BY count DESC
                LIMIT 5
            """)
            rows = cur.fetchall()
            return jsonify({"by_location": rows})
        except Error as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if cur: cur.close()
            conn.close()

    @app.get("/api/incidents/by-day")
    def incidents_by_day():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = None
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT DATE(date) as day, COUNT(*) as count
                FROM traffic_incidents
                GROUP BY day
                ORDER BY day DESC
                LIMIT 30
            """)
            rows = cur.fetchall()
            return jsonify({"by_day": rows})
        except Error as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if cur: cur.close()
            conn.close()

    # -----------------
    # ML Prediction Endpoint
    # -----------------
    @app.post("/api/predict")
    def predict():
        """
        Accepts JSON in any of these shapes:

        1) Single row:
           { "accidents": 2, "avg_speed": 55 }

        2) Array of rows:
           [ {"accidents": 2, "avg_speed": 55}, {"accidents": 0, "avg_speed": 42} ]

        3) Wrapped:
           { "rows": [ {"accidents": 2, "avg_speed": 55}, ... ] }
        """
        if app.model is None:
            return jsonify(error=f"Model not loaded at {str(MODEL_PATH)}. Train it first."), 500

        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify(error="Invalid or missing JSON body."), 400

        # Normalize to list of dict rows
        if isinstance(payload, dict) and all(k in payload for k in FEATURES):
            rows = [{f: payload[f] for f in FEATURES}]
        elif isinstance(payload, dict) and "rows" in payload:
            rows = payload["rows"]
        elif isinstance(payload, list):
            rows = payload
        else:
            return jsonify(
                error="Provide either {accidents, avg_speed} or an array of such objects or {rows:[...]}.",
                expected_features=FEATURES
            ), 400

        df = pd.DataFrame(rows)

        # Validate required features
        missing = [c for c in FEATURES if c not in df.columns]
        if missing:
            return jsonify(error=f"Missing columns: {missing}", expected=FEATURES), 400

        # Coerce numerics and guard bad inputs
        for col in FEATURES:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        if df[FEATURES].isna().any().any():
            bad = [c for c in FEATURES if df[c].isna().any()]
            return jsonify(error=f"Non-numeric or null values in {bad}"), 400

        try:
            preds = app.model.predict(df[FEATURES])
        except Exception as e:
            return jsonify(error=f"Model prediction failed: {e}"), 500

        preds = [float(x) for x in np.asarray(preds).ravel().tolist()]
        return jsonify(predictions=preds, count=len(preds))

    return app


# -----------------
# Entry point
# -----------------
if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5001))  # use .env PORT or default 5001
    app.run(host="0.0.0.0", port=port, debug=True)