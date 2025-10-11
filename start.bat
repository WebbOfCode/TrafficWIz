@echo off
echo Starting Flask Backend and Frontend...
echo.

REM Start backend in new window (create venv, install deps, seed DB, then start app)
start "Flask Backend" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && echo Running DB seeder... && python scripts\seed_traffic.py --n 200 --days 60 && echo Starting Flask app... && python app.py"

REM Wait a moment for backend to initialize
timeout /t 5 /nobreak >nul

REM Start frontend in new window
start "Frontend Dev Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Close the command windows to stop the servers.