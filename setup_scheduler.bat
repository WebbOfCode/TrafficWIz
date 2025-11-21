@echo off
REM Setup Windows Task Scheduler to run HERE data collector every hour

set TASK_NAME=TrafficWiz_DataCollector
set SCRIPT_PATH=%~dp0backend\services\here_data_collector.py
set PYTHON_PATH=%~dp0.venv\Scripts\python.exe
set WORKING_DIR=%~dp0backend\services

echo Setting up scheduled task: %TASK_NAME%
echo Python: %PYTHON_PATH%
echo Script: %SCRIPT_PATH%

REM Delete existing task if it exists
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

REM Create new task to run every hour
schtasks /Create /TN "%TASK_NAME%" /TR "\"%PYTHON_PATH%\" \"%SCRIPT_PATH%\" --once" /SC HOURLY /ST 00:00 /RU "%USERNAME%" /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Task created successfully.
    echo.
    echo The data collector will now run automatically every hour.
    echo.
    echo To manage the task:
    echo   - View: schtasks /Query /TN "%TASK_NAME%" /V /FO LIST
    echo   - Run now: schtasks /Run /TN "%TASK_NAME%"
    echo   - Delete: schtasks /Delete /TN "%TASK_NAME%" /F
    echo   - Or use Task Scheduler GUI: taskschd.msc
) else (
    echo.
    echo ERROR: Failed to create scheduled task.
    echo Make sure you run this as Administrator.
)

pause
