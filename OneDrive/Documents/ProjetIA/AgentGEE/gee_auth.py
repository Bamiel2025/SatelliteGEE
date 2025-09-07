import ee
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def authenticate_gee():
    """
    Authenticate with Google Earth Engine
    This function should be run once to set up authentication
    """
    try:
        # Get project ID from environment variables
        project_id = os.environ.get('GEE_PROJECT_ID', 'your-project-id')
        
        # Check if project ID is set
        if project_id == 'your-project-id':
            print("Warning: Using default project ID. Please set GEE_PROJECT_ID in your .env file")
        
        # Try to initialize first to see if we're already authenticated
        ee.Initialize(project=project_id)
        print("Already authenticated with Google Earth Engine")
        return True
    except Exception as e:
        print("Not authenticated with Google Earth Engine. Starting authentication process...")
        try:
            # Authenticate with GEE
            ee.Authenticate()
            # Initialize the library with project ID
            project_id = os.environ.get('GEE_PROJECT_ID', 'your-project-id')
            ee.Initialize(project=project_id)
            print("Successfully authenticated with Google Earth Engine")
            return True
        except Exception as auth_error:
            print(f"Failed to authenticate with Google Earth Engine: {auth_error}")
            print("Please make sure you have:")
            print("1. A Google Cloud Project set up with Earth Engine API enabled")
            print("2. Set the GEE_PROJECT_ID environment variable to your project ID")
            print("3. Followed the instructions at https://developers.google.com/earth-engine/cloud/console_setup")
            return False

def geocode_location(location_name):
    """
    Convert a location name to coordinates using a geocoding service
    """
    try:
        # Using OpenStreetMap Nominatim API for geocoding
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': location_name,
            'format': 'json',
            'limit': 1
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        if data:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            display_name = data[0]['display_name']
            return {
                'lat': lat,
                'lon': lon,
                'display_name': display_name
            }
        else:
            return None
    except Exception as e:
        print(f"Error geocoding location: {e}")
        return None

def get_satellite_image(location, start_date, end_date, collection="LANDSAT/LC08/C02/T1_L2"):
    """
    Get a satellite image from Google Earth Engine for a specific location and date range
    """
    try:
        # Create a point geometry
        point = ee.Geometry.Point([location['lon'], location['lat']])
        
        # Load the satellite image collection
        collection = ee.ImageCollection(collection)
        
        # Filter by date and location
        filtered = collection.filterDate(start_date, end_date).filterBounds(point)
        
        # Get the first image (or median composite)
        image = filtered.median()
        
        # Create a visualization
        vis_params = {
            'bands': ['SR_B4', 'SR_B3', 'SR_B2'],  # RGB bands for Landsat 8
            'min': 0,
            'max': 0.3
        }
        
        # Get the map ID and token for visualization
        map_id = image.getMapId(vis_params)
        
        return {
            'map_id': map_id['mapid'],
            'token': map_id['token'],
            'location': location
        }
    except Exception as e:
        print(f"Error getting satellite image: {e}")
        return None

if __name__ == "__main__":
    print("Google Earth Engine Authentication Script")
    print("========================================")
    print()
    print("Before running this script, you need to:")
    print("1. Create a Google Cloud Project")
    print("2. Enable the Earth Engine API")
    print("3. Set the GEE_PROJECT_ID environment variable")
    print()
    print("Visit https://developers.google.com/earth-engine/cloud/console_setup for detailed instructions")
    print()
    
    # Authenticate with GEE
    if authenticate_gee():
        print()
        print("Authentication successful!")
        print()
        print("You can now run the server.py script to start the application")
    else:
        print()
        print("Authentication failed. Please check the instructions above.")