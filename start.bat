@echo off
echo Starting Flask Backend and Frontend...
echo.

REM Start backend in new window
start "Flask Backend" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && python app.py"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend Dev Server" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Close the command windows to stop the servers.