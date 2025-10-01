from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error

# -----------------
# App Initialization
# -----------------
app = FastAPI(
    title="TrafficWiz API",
    description="Backend API for TrafficWiz project",
    version="1.0.0"
)

# -----------------
# Allow Frontend Access
# -----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for dev; later restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Database Connection
# -----------------
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",
            user="trafficwiz_user",      # change if needed
            password="StrongPass123!",   # change if needed
            database="trafficwiz"
        )
        return conn
    except Error as e:
        print(f"MySQL connection error: {e}")
        return None

# -----------------
# API Router
# -----------------
api_router = APIRouter()

# Health check
@api_router.get("/health")
def health():
    return {"status": "ok", "message": "Backend running"}

# All traffic incidents
@api_router.get("/traffic")
def traffic_data():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, date, location, severity, description
            FROM traffic_incidents
            ORDER BY date DESC
            LIMIT 100
        """)
        rows = cursor.fetchall()
        return {"traffic_data": rows}
    finally:
        cursor.close()
        conn.close()

# Count incidents by severity
@api_router.get("/incidents/by-severity")
def incidents_by_severity():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT severity, COUNT(*) as count
            FROM traffic_incidents
            GROUP BY severity
        """)
        rows = cursor.fetchall()
        return {"by_severity": rows}
    finally:
        cursor.close()
        conn.close()

# Top 5 locations
@api_router.get("/incidents/by-location")
def incidents_by_location():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT location, COUNT(*) as count
            FROM traffic_incidents
            GROUP BY location
            ORDER BY count DESC
            LIMIT 5
        """)
        rows = cursor.fetchall()
        return {"by_location": rows}
    finally:
        cursor.close()
        conn.close()

# Incidents by day
@api_router.get("/incidents/by-day")
def incidents_by_day():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DATE(date) as day, COUNT(*) as count
            FROM traffic_incidents
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        """)
        rows = cursor.fetchall()
        return {"by_day": rows}
    finally:
        cursor.close()
        conn.close()

# -----------------
# Mount Router
# -----------------
app.include_router(api_router, prefix="/api")
