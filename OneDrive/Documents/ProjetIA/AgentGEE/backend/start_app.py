#!/usr/bin/env python3
"""
Helper script to start the Satellite Image Analyzer application
"""
import os
import subprocess
import sys
import time
import webbrowser
from threading import Thread

def check_prerequisites():
    """Check if required tools are installed"""
    prerequisites = {
        'node': 'Node.js is required for the frontend',
        'python': 'Python is required for the backend',
        'npm': 'npm is required for frontend dependencies'
    }
    
    missing = []
    for tool, message in prerequisites.items():
        try:
            subprocess.run([tool, '--version'], 
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL)
        except FileNotFoundError:
            missing.append(f"{tool}: {message}")
    
    return missing

def install_frontend_deps():
    """Install frontend dependencies"""
    print("Installing frontend dependencies...")
    try:
        subprocess.run(['npm', 'install'], check=True)
        print("Frontend dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install frontend dependencies")
        return False

def install_python_deps():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True)
        print("Python dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install Python dependencies")
        return False

def start_frontend():
    """Start the frontend development server"""
    print("Starting frontend development server...")
    try:
        # Use Popen to run in background
        process = subprocess.Popen(['npm', 'start'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE,
                                 text=True)
        return process
    except Exception as e:
        print(f"Failed to start frontend: {e}")
        return None

def start_backend():
    """Start the backend server"""
    print("Starting backend server...")
    try:
        # Use Popen to run in background
        process = subprocess.Popen([sys.executable, 'server.py'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE,
                                 text=True)
        return process
    except Exception as e:
        print(f"Failed to start backend: {e}")
        return None

def open_browser():
    """Open browser after servers start"""
    # Wait a bit for servers to start
    time.sleep(5)
    webbrowser.open('http://localhost:3000')

def main():
    print("Satellite Image Analyzer - Startup Script")
    print("=" * 45)
    
    # Check prerequisites
    missing = check_prerequisites()
    if missing:
        print("Missing prerequisites:")
        for item in missing:
            print(f"  - {item}")
        print("\nPlease install the missing tools and try again.")
        return
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("Warning: .env file not found!")
        print("Please create a .env file with your GEE_PROJECT_ID")
        print("You can copy .env.example to .env and update it with your project ID")
        response = input("\nContinue anyway? (y/N): ")
        if response.lower() != 'y':
            return
    
    # Install dependencies
    print("\nInstalling dependencies...")
    if not install_frontend_deps() or not install_python_deps():
        print("Failed to install dependencies. Exiting.")
        return
    
    # Start servers
    print("\nStarting servers...")
    backend_process = start_backend()
    if not backend_process:
        print("Failed to start backend server. Exiting.")
        return
    
    frontend_process = start_frontend()
    if not frontend_process:
        print("Failed to start frontend server. Exiting.")
        # Terminate backend
        backend_process.terminate()
        return
    
    # Open browser in a separate thread
    browser_thread = Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    print("\nServers started successfully!")
    print("Frontend: http://localhost:3000")
    print("Backend: http://localhost:5000")
    print("\nPress Ctrl+C to stop the servers")
    
    try:
        # Wait for processes
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down servers...")
        frontend_process.terminate()
        backend_process.terminate()
        print("Servers stopped. Goodbye!")

if __name__ == "__main__":
    main()