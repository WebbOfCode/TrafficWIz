# ============================================================
# TrafficWiz Backend – merged Role E + Role D version
# Flask backend with MySQL + ML integration
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

# ============================================================
# App configuration
# ============================================================

app = Flask(__name__)
CORS(app)

# Database configuration (update if needed)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "trafficwiz_db")
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "ml", "metrics.json")

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


@app.route("/incidents", methods=["GET"])
def get_incidents():
    """Return traffic incident data from the DB."""
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM incidents ORDER BY id DESC LIMIT 100;")
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
# Server runner
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
