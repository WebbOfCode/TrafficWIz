import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load environment variables from .env
load_dotenv()

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

    # Health check route
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "TrafficWiz API"})

    # Demo endpoint
    @app.get("/api/demo")
    def demo():
        return jsonify({"message": "This is a demo endpoint"})

    # Hello endpoint
    @app.get("/api/hello")
    def hello():
        return jsonify({"message": "Hello from TrafficWiz API!"})

    # Echo endpoint (POST)
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
            cur.close()
            conn.close()

    @app.get("/api/incidents/by-severity")
    def incidents_by_severity():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("""
                SELECT severity, COUNT(*) as count
                FROM traffic_incidents
                GROUP BY severity
            """)
            rows = cur.fetchall()
            return jsonify({"by_severity": rows})
        finally:
            cur.close()
            conn.close()

    @app.get("/api/incidents/by-location")
    def incidents_by_location():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
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
        finally:
            cur.close()
            conn.close()

    @app.get("/api/incidents/by-day")
    def incidents_by_day():
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
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
        finally:
            cur.close()
            conn.close()

    return app

# -----------------
# Entry point
# -----------------
if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5001))  # use .env PORT or default 5001
    app.run(host="0.0.0.0", port=port, debug=True)
