@echo off
title CPM-PERT Solver Launcher
echo =======================================================
echo     Starting PERT-CPM Solver Setup and Launch
echo =======================================================
echo.

:: Check if requirements file exists and install missing dependencies
if exist "requirements.txt" (
    echo [1/3] Verifying and installing Python requirements...
    python -m pip install -r requirements.txt
) else (
    echo [1/3] requirements.txt not found. Skipping auto-install.
)

echo.
echo [2/3] Scheduling browser launch on localhost...
:: Use ping as a lightweight 3-second sleep, then open the default browser to the Flask port
start cmd /c "ping 127.0.0.1 -n 3 > nul & start http://127.0.0.1:5000/"

echo.
echo [3/3] Starting Flask Server...
python app.py

pause
