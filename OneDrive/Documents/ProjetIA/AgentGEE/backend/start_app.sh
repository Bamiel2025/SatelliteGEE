#!/bin/bash

# Satellite Image Analyzer - Startup Script

echo "Satellite Image Analyzer - Startup Script"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.7 or later and try again"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js and try again"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found!"
    echo "Please create a .env file with your GEE_PROJECT_ID"
    echo "You can copy .env.example to .env and update it with your project ID"
    echo
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 0
    fi
    echo
fi

echo "Installing dependencies..."
echo "=========================="

echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies"
    exit 1
fi

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi

echo
echo "Starting servers..."
echo "==================="

# Start backend server in background
echo "Starting backend server..."
python3 server.py &

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
npm start

echo
echo "To stop the servers, press Ctrl+C"