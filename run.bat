@echo off
title Personal Expense Tracker Launcher
echo ========================================================
echo       Launching Personal Expense Tracker & MongoDB
echo ========================================================
echo.

:: Start MongoDB Server in a background window
echo [1/2] Starting Local MongoDB Server...
start "MongoDB Local Server (Port 27017)" cmd /k "npm run mongo:local"

:: Wait 3 seconds for MongoDB to initialize
echo [2/2] Waiting for MongoDB to initialize...
timeout /t 3 /nobreak >nul

:: Start frontend and backend concurrently
echo.
echo Starting Web Dashboard and Backend API...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================================
echo.
npm run dev

