REM ============================================================
REM TrafficWiz - Development Environment Launcher
REM ============================================================
REM Purpose: One-command startup for backend and frontend servers
REM
REM What this script does:
REM 1. Backend (Flask):
REM    - Creates Python virtual environment (if needed)
REM    - Installs backend dependencies from requirements.txt
REM    - Runs database seeder (200 incidents, 60 days range)
REM    - Starts Flask API server on port 5000
REM 2. Frontend (Vite + React):
REM    - Installs npm dependencies
REM    - Starts Vite dev server on port 5173
REM
REM Requirements:
REM - MySQL running and accessible
REM - backend/.env with DB credentials configured
REM - Python 3.x and Node.js/npm installed
REM
REM Usage: Double-click start.bat or run from command line
REM
REM Note: Two separate command windows will open for backend and frontend
REM ============================================================

@echo off
echo Starting Flask Backend and Frontend...
echo.

REM Start backend in new window (create venv, install deps, seed DB, then start app)
start "Flask Backend" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && echo Running DB seeder... && python scripts\seed_traffic.py --n 200 --days 60 && echo Starting Flask app... && python app.py"

REM Wait a moment for backend to initialize
timeout /t 10 /nobreak >nul

REM Start frontend in new window
start "Frontend Dev Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Close the command windows to stop the servers.