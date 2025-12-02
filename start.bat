
@echo off
echo ============================================
echo TrafficWiz - Starting Application
echo ============================================
echo.

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo Virtual environment not found. Creating it now...
    python -m venv backend\venv
    echo Installing Python dependencies...
    backend\venv\Scripts\pip install -r backend\requirements.txt
    echo.
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo Frontend dependencies not found. Installing npm packages...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Setup Windows Task Scheduler for HERE data collection (first time only)
echo [1/4] Setting up scheduled data collection...
if not exist "backend\scheduler_setup_complete.flag" (
    echo Creating scheduled task for HERE data collector...
    schtasks /create /tn "TrafficWiz_HereCollector" /tr "%CD%\backend\venv\Scripts\python.exe %CD%\backend\services\here_data_collector.py --once" /sc hourly /mo 1 /f /rl highest
    if %errorlevel% equ 0 (
        echo Scheduled task created successfully - will run every hour
        echo. > backend\scheduler_setup_complete.flag
    ) else (
        echo WARNING: Could not create scheduled task. You may need administrator privileges.
        echo You can still run the data collector manually.
    )
) else (
    echo Scheduled task already configured.
)
echo.

REM Start Flask backend
echo [2/4] Starting Flask backend server...
start "TrafficWiz Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"
timeout /t 3 /nobreak >nul
echo.

REM Start Vite frontend
echo [3/4] Starting Vite frontend server...
start "TrafficWiz Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.

REM Run HERE data collector once on startup
echo [4/5] Collecting initial HERE traffic data...
start "HERE Data Collector" cmd /k "cd backend && venv\Scripts\activate && python services\here_data_collector.py --once && echo. && echo Initial data collection complete. && timeout /t 5"
echo.

REM Train ML model
echo [5/5] Training machine learning model...
start "ML Model Training" cmd /k "cd backend && venv\Scripts\activate && python ml\train_model.py && echo. && echo Model training complete. && timeout /t 5"
echo.

echo ============================================
echo TrafficWiz Started Successfully!
echo ============================================
echo.
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo.
echo Scheduled Task: Runs every hour automatically
echo Manual refresh: http://127.0.0.1:5000/api/refresh-incidents
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:5173