@echo off
title Satellite Image Analyzer

echo Satellite Image Analyzer - Startup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7 or later and try again
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    echo.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo Warning: .env file not found!
    echo Please create a .env file with your GEE_PROJECT_ID
    echo You can copy .env.example to .env and update it with your project ID
    echo.
    set /p continue=Continue anyway? (y/N): 
    if /i not "%continue%"=="y" (
        exit /b 0
    )
    echo.
)

echo Installing dependencies...
echo ==========================

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)

echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Starting servers...
echo =================

REM Start backend server in background
start "Backend Server" /min python server.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
npm start

echo.
echo To stop the servers, close both command windows or press Ctrl+C
pause