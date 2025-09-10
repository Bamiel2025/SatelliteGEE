#!/usr/bin/env python3
"""
Google Earth Engine Authentication Helper
"""
import ee
import os
import sys
from dotenv import load_dotenv

def main():
    print("Google Earth Engine Authentication Helper")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Get project ID
    project_id = os.environ.get('GEE_PROJECT_ID')
    
    if not project_id or project_id == 'your-project-id':
        print("❌ ERROR: GEE_PROJECT_ID not set in .env file")
        print("\nTo fix this issue:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project or select an existing one")
        print("3. Find your Project ID (NOT the project name)")
        print("4. Edit the .env file and replace 'your-project-id' with your actual Project ID")
        print("\nExample Project ID format: satellite-analyzer-123456")
        print("\nFor detailed instructions, see GEE_AUTHENTICATION.md")
        return 1
    
    print(f"Project ID: {project_id}")
    
    try:
        # Try to initialize first
        print("Checking existing authentication...")
        ee.Initialize(project=project_id)
        print("✅ Already authenticated!")
        return 0
    except Exception as e:
        print("Authentication needed. Starting authentication process...")
        pass
    
    try:
        # Authenticate with GEE
        print("Opening browser for authentication...")
        print("Please sign in with your Google account and grant permissions.")
        ee.Authenticate()
        
        # Initialize the library
        print("Initializing Earth Engine...")
        ee.Initialize(project=project_id)
        
        print("\n✅ SUCCESS: Authentication completed!")
        print("You can now run the application.")
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR: Authentication failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure you have a Google Cloud Project")
        print("2. Ensure the Earth Engine API is enabled")
        print("3. Check that you're using the correct project ID (not project name)")
        print("4. Verify your Google account has Earth Engine access")
        print("\nFor detailed instructions, see GEE_AUTHENTICATION.md")
        return 1

if __name__ == "__main__":
    sys.exit(main())