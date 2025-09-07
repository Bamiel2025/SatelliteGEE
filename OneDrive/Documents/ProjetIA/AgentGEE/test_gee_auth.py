#!/usr/bin/env python3
"""
Test script to verify Google Earth Engine authentication
"""
import ee
import os
from dotenv import load_dotenv

def test_gee_authentication():
    """Test GEE authentication and initialization"""
    print("Google Earth Engine Authentication Test")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Get project ID
    project_id = os.environ.get('GEE_PROJECT_ID')
    
    if not project_id or project_id == 'your-project-id':
        print("❌ ERROR: GEE_PROJECT_ID not set in .env file")
        print("Please set your Google Cloud Project ID in the .env file")
        return False
    
    print(f"Project ID: {project_id}")
    
    try:
        # Initialize Earth Engine
        print("Initializing Earth Engine...")
        ee.Initialize(project=project_id)
        print("✅ SUCCESS: Earth Engine initialized successfully")
        
        # Test a simple operation
        print("Testing Earth Engine operation...")
        image = ee.Image('LANDSAT/LC08/C02/T1_L2/LC08_044034_20140318')
        info = image.getInfo()
        
        if info:
            print("✅ SUCCESS: Earth Engine operation completed")
            print(f"   Image ID: {info['id']}")
            print(f"   Satellite: {info['properties']['SPACECRAFT_ID']}")
            return True
        else:
            print("❌ ERROR: Earth Engine operation failed")
            return False
            
    except ee.EEException as e:
        print(f"❌ ERROR: Earth Engine exception: {e}")
        return False
    except Exception as e:
        print(f"❌ ERROR: Unexpected error: {e}")
        return False

def test_gee_credentials():
    """Test if credentials are available"""
    print("\nCredential Check")
    print("-" * 20)
    
    try:
        # Check if default credentials are available
        import google.auth
        credentials, project = google.auth.default()
        print("✅ Default credentials found")
        if project:
            print(f"   Project: {project}")
        return True
    except Exception as e:
        print(f"❌ Default credentials not found: {e}")
        return False

def main():
    """Run all authentication tests"""
    print("Satellite Image Analyzer - GEE Authentication Test")
    print("=" * 50)
    
    # Test credentials
    credentials_ok = test_gee_credentials()
    
    # Test authentication
    auth_ok = test_gee_authentication()
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    print(f"Credentials: {'✅ OK' if credentials_ok else '❌ FAILED'}")
    print(f"Authentication: {'✅ OK' if auth_ok else '❌ FAILED'}")
    
    if credentials_ok and auth_ok:
        print("\n🎉 All tests passed! You're ready to use the application.")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        print("\nTroubleshooting tips:")
        print("1. Run 'python gee_auth.py' to authenticate")
        print("2. Check your .env file for correct GEE_PROJECT_ID")
        print("3. Verify Earth Engine API is enabled in Google Cloud Console")
        return 1

if __name__ == "__main__":
    exit(main())