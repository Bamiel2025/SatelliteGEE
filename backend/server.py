from flask import Flask, jsonify, request
from flask_cors import CORS
import ee
import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='docs', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Global variable to track GEE initialization status
gee_initialized = False
gee_error = None

# Initialize Earth Engine
def initialize_gee():
    global gee_initialized, gee_error
    try:
        # Get project ID from environment variables or use default
        project_id = os.environ.get('GEE_PROJECT_ID', 'your-project-id')
        
        # Check if project ID is set
        if project_id == 'your-project-id':
            gee_error = "Warning: Using default project ID. Please set GEE_PROJECT_ID in your environment variables. See GEE_AUTHENTICATION.md for setup instructions."
            print(gee_error)
            return False
        
        ee.Initialize(project=project_id)
        gee_initialized = True
        print("Google Earth Engine initialized successfully")
        return True
    except ee.EEException as e:
        gee_error = f"Earth Engine error: {str(e)}. Please check GEE_AUTHENTICATION.md for setup instructions."
        print(f"Failed to initialize Google Earth Engine: {e}")
        return False
    except Exception as e:
        gee_error = f"Unexpected error: {str(e)}. Please check GEE_AUTHENTICATION.md for setup instructions."
        print(f"Failed to initialize Google Earth Engine: {e}")
        return False

# Try to initialize GEE when the server starts
initialize_gee()

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
            'limit': 5,  # Get more results to find a good match
            'addressdetails': 1
        }

        headers = {
            'User-Agent': 'Satellite-Image-Analyzer/1.0'
        }

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data and len(data) > 0:
            # Find the best result (prefer cities, towns, etc.)
            best_result = None
            for result in data:
                if result.get('type') in ['city', 'town', 'village', 'administrative']:
                    best_result = result
                    break
            # If no preferred type found, use the first result
            if not best_result:
                best_result = data[0]

            lat = float(best_result['lat'])
            lon = float(best_result['lon'])
            display_name = best_result['display_name']
            return {
                'lat': lat,
                'lon': lon,
                'display_name': display_name
            }
        else:
            return None
    except requests.exceptions.Timeout:
        print("Geocoding request timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Network error during geocoding: {e}")
        return None
    except Exception as e:
        print(f"Error geocoding location: {e}")
        return None

@app.route('/geocode', methods=['POST'])
def geocode():
    """
    Geocode a location name to coordinates
    """
    data = request.get_json()
    location_name = data.get('location')
    
    if not location_name:
        return jsonify({'error': 'Location name is required'}), 400
    
    location = geocode_location(location_name)
    if location:
        return jsonify(location)
    else:
        return jsonify({'error': 'Location not found. Please try a different name or check your internet connection.'}), 404

@app.route('/satellite-image', methods=['POST'])
def get_satellite_image():
    """
    Get a satellite image from Google Earth Engine for a specific location and date range
    """
    # Check if GEE is initialized
    if not gee_initialized:
        return jsonify({
            'error': 'Google Earth Engine not initialized',
            'details': gee_error or 'Please check server logs for details. See GEE_AUTHENTICATION.md for setup instructions.'
        }), 500
    
    data = request.get_json()
    location = data.get('location')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    filter_type = data.get('filter', 'rgb')  # Default to RGB
    # Removed event_type parameter handling

    if not all([location, start_date, end_date]):
        return jsonify({'error': 'Location, start_date, and end_date are required'}), 400

    # Validate date format and range
    try:
        from datetime import datetime
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')

        if start_dt >= end_dt:
            return jsonify({'error': 'Start date must be before end date'}), 400

        # Ensure reasonable date range (not too large)
        date_diff = (end_dt - start_dt).days
        if date_diff > 365:  # Max 1 year range
            return jsonify({'error': 'Date range cannot exceed 1 year'}), 400

    except ValueError as e:
        return jsonify({'error': f'Invalid date format. Use YYYY-MM-DD format. Error: {str(e)}'}), 400
    
    try:
        # Create a small bounding box around the location for better coverage (0.1 degrees ~11km)
        lat = location['lat']
        lon = location['lon']
        buffer = 0.1
        bounds = [
            [lon - buffer, lat - buffer],
            [lon + buffer, lat - buffer],
            [lon + buffer, lat + buffer],
            [lon - buffer, lat + buffer],
            [lon - buffer, lat - buffer]
        ]
        geometry = ee.Geometry.Polygon([bounds])

        # Use a default satellite collection
        collection_name = "LANDSAT/LC08/C02/T1_L2"

        # Load the satellite image collection
        collection = ee.ImageCollection(collection_name)

        # Broaden the initial date range: +/- 30 days around the provided range midpoint
        from datetime import datetime, timedelta
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        mid_dt = start_dt + (end_dt - start_dt) / 2
        broadened_start = (mid_dt - timedelta(days=30)).strftime('%Y-%m-%d')
        broadened_end = (mid_dt + timedelta(days=30)).strftime('%Y-%m-%d')

        # Filter by broadened date and geometry
        filtered = collection.filterDate(broadened_start, broadened_end).filterBounds(geometry)

        # Check if we have any images
        image_count = filtered.size().getInfo()
        print(f"Found {image_count} images for broadened date range {broadened_start} to {broadened_end} around location {lat}, {lon}")

        if image_count == 0:
            # Try an even broader date range: +/- 90 days
            print("No images found, trying broader date range...")
            broader_start = (mid_dt - timedelta(days=90)).strftime('%Y-%m-%d')
            broader_end = (mid_dt + timedelta(days=90)).strftime('%Y-%m-%d')

            print(f"Trying extended range: {broader_start} to {broader_end}")
            filtered = collection.filterDate(broader_start, broader_end).filterBounds(geometry)
            image_count = filtered.size().getInfo()
            print(f"Found {image_count} images in extended range")

            if image_count == 0:
                # Try with Sentinel-2 as an alternative with original dates
                print("No Landsat images found, trying Sentinel-2...")
                collection_name = "COPERNICUS/S2_SR"
                collection = ee.ImageCollection(collection_name)
                filtered = collection.filterDate(start_date, end_date).filterBounds(geometry)
                image_count = filtered.size().getInfo()
                print(f"Found {image_count} Sentinel-2 images")

                if image_count == 0:
                    # Final try: Sentinel-2 with broadened dates
                    filtered = collection.filterDate(broadened_start, broadened_end).filterBounds(geometry)
                    image_count = filtered.size().getInfo()
                    print(f"Found {image_count} Sentinel-2 images in broadened range")

                    if image_count == 0:
                        return jsonify({
                            'error': f'No satellite images found for the specified location and date range. This could be due to:\n• Location not covered by satellite imagery (e.g., poles, oceans)\n• Cloud cover blocking the view\n• Date range with no available images\n• Try a different location or date range.'
                        }), 404

        # Get the median composite of available images and apply scaling
        if collection_name == "LANDSAT/LC08/C02/T1_L2" or collection_name == "LANDSAT/LE07/C02/T1_L2" or collection_name == "LANDSAT/LT05/C02/T1_L2":
            image = filtered.median().multiply(0.0000275).add(-0.2)
            band_prefix = 'SR_'
        else:
            # For Sentinel-2
            image = filtered.median().multiply(0.0001)
            band_prefix = ''

        # Determine visualization parameters based on filter
        if filter_type == 'ndwi':
            # NDWI: (Green - NIR) / (Green + NIR)
            green = image.select(f'{band_prefix}B3')
            nir = image.select(f'{band_prefix}B5')
            ndwi = green.subtract(nir).divide(green.add(nir)).rename(['ndwi'])
            vis_params = {
                'bands': ['ndwi'],
                'min': -1,
                'max': 1,
                'palette': ['blue', 'white', 'green']  # Water in blue, land in green
            }
            image = ndwi
        elif filter_type == 'ndvi':
            # NDVI: (NIR - Red) / (NIR + Red)
            nir = image.select(f'{band_prefix}B5')
            red = image.select(f'{band_prefix}B4')
            ndvi = nir.subtract(red).divide(nir.add(red)).rename(['ndvi'])
            vis_params = {
                'bands': ['ndvi'],
                'min': -1,
                'max': 1,
                'palette': ['red', 'yellow', 'green']  # Low veg red, high veg green
            }
            image = ndvi
        elif filter_type == 'false_color':
            # False color: NIR, Red, Green for vegetation enhancement
            vis_params = {
                'bands': [f'{band_prefix}B5', f'{band_prefix}B4', f'{band_prefix}B3'],  # NIR, Red, Green
                'min': 0,
                'max': 0.3
            }
        else:
            # Default RGB
            vis_params = {
                'bands': [f'{band_prefix}B4', f'{band_prefix}B3', f'{band_prefix}B2'],
                'min': 0,
                'max': 0.3
            }

        # Get the map ID and token for visualization
        map_id = image.getMapId(vis_params)

        return jsonify({
            'map_id': map_id['mapid'],
            'token': map_id.get('token', ''),  # Token might be empty in newer GEE versions
            'location': location,
            'collection': collection_name,
            'image_count': image_count,
            'date_range': f'{start_date} to {end_date} (broadened to {broadened_start} to {broadened_end})',
            'filter': filter_type
        })
    except Exception as e:
        print(f"Error getting satellite image: {e}")
        return jsonify({'error': f'Failed to retrieve satellite image: {str(e)}. Please check GEE_AUTHENTICATION.md for setup instructions.'}), 500

def calculate_area(geometry):
    """
    Calculate area of a polygon geometry using GEE
    """
    try:
        if not gee_initialized:
            return {'error': 'Google Earth Engine not initialized'}
        
        total_area = 0
        if geometry['type'] == 'Polygon':
            coords = geometry['coordinates'][0]  # exterior ring
            ee_geom = ee.Geometry.Polygon([coords])
            area = ee_geom.area().getInfo() / 1e6
            total_area += area
        elif geometry['type'] == 'MultiPolygon':
            for poly in geometry['coordinates']:
                coords = poly[0]  # exterior ring of first polygon
                ee_geom = ee.Geometry.Polygon([coords])
                area = ee_geom.area().getInfo() / 1e6
                total_area += area
        else:
            return {'error': 'Invalid geometry type for area calculation. Expected Polygon or MultiPolygon.'}
        
        return {'area': total_area, 'unit': 'km²'}
    except Exception as e:
        print(f"Error calculating area: {e}")
        return {'error': str(e)}

@app.route('/measure-area', methods=['POST'])
def measure_area():
    """
    Endpoint to measure area from GeoJSON polygon
    """
    if not gee_initialized:
        return jsonify({
            'error': 'Google Earth Engine not initialized',
            'details': gee_error or 'Please check server logs for details.'
        }), 500
    
    data = request.get_json()
    geometry = data.get('geometry')
    
    if not geometry:
        return jsonify({'error': 'Geometry is required'}), 400
    
    result = calculate_area(geometry)
    if 'error' in result:
        return jsonify(result), 500
    
    return jsonify(result)

def calculate_distance(geometry):
    """
    Calculate length of a line geometry using GEE
    """
    try:
        if not gee_initialized:
            return {'error': 'Google Earth Engine not initialized'}
        
        total_length = 0
        if geometry['type'] == 'LineString':
            coords = geometry['coordinates']
            ee_geom = ee.Geometry.LineString(coords)
            length = ee_geom.length().getInfo() / 1000
            total_length += length
        elif geometry['type'] == 'MultiLineString':
            for line in geometry['coordinates']:
                ee_geom = ee.Geometry.LineString(line)
                length = ee_geom.length().getInfo() / 1000
                total_length += length
        else:
            return {'error': 'Invalid geometry type for distance calculation. Expected LineString or MultiLineString.'}
        
        return {'distance': total_length, 'unit': 'km'}
    except Exception as e:
        print(f"Error calculating distance: {e}")
        return {'error': str(e)}

@app.route('/measure-distance', methods=['POST'])
def measure_distance():
    """
    Endpoint to measure distance from GeoJSON polyline
    """
    if not gee_initialized:
        return jsonify({
            'error': 'Google Earth Engine not initialized',
            'details': gee_error or 'Please check server logs for details.'
        }), 500
    
    data = request.get_json()
    geometry = data.get('geometry')
    
    if not geometry:
        return jsonify({'error': 'Geometry is required'}), 400
    
    result = calculate_distance(geometry)
    if 'error' in result:
        return jsonify(result), 500
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'ok',
        'gee_initialized': gee_initialized,
        'gee_error': gee_error,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/auth-status', methods=['GET'])
def auth_status():
    """
    Authentication status endpoint
    """
    return jsonify({
        'gee_initialized': gee_initialized,
        'gee_error': gee_error,
        'project_id': os.environ.get('GEE_PROJECT_ID', 'not set')
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    """
    Serve the React app for all routes
    """
    if path.startswith('api/') or path in ['geocode', 'satellite-image', 'health', 'auth-status']:
        return jsonify({'error': 'API route not found'}), 404
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=8080)