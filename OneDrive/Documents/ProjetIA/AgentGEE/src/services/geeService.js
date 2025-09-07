/**
 * Service to communicate with the Python backend for GEE integration
 */

const API_BASE_URL = 'http://localhost:5000';

/**
 * Check authentication status with the backend
 * @returns {Promise<Object>} - Authentication status
 */
export const checkAuthStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth-status`);
    return await response.json();
  } catch (error) {
    console.error('Auth status check error:', error);
    return { gee_initialized: false, error: 'Failed to check auth status' };
  }
};

/**
 * Geocode a location name to coordinates
 * @param {string} locationName - Name of the location
 * @returns {Promise<Object>} - Geocoded location
 */
export const geocodeLocation = async (locationName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location: locationName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to geocode location');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Get satellite image from Google Earth Engine
 * @param {Object} params - Image parameters
 * @returns {Promise<Object>} - Satellite image information
 */
export const getSatelliteImage = async (params, filter = 'rgb') => {
  try {
    const requestParams = { ...params, filter };
    const response = await fetch(`${API_BASE_URL}/satellite-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestParams),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve satellite image');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Satellite image error:', error);
    throw error;
  }
};

/**
 * Measure area from GeoJSON polygon
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Promise<Object>} - Area measurement result
 */
export const measureArea = async (geometry) => {
  try {
    const response = await fetch(`${API_BASE_URL}/measure-area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geometry }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to measure area');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Area measurement error:', error);
    throw error;
  }
};

/**
 * Measure distance from GeoJSON LineString
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Promise<Object>} - Distance measurement result
 */
export const measureDistance = async (geometry) => {
  try {
    const response = await fetch(`${API_BASE_URL}/measure-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geometry }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to measure distance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Distance measurement error:', error);
    throw error;
  }
};

/**
 * Get available satellite collections
 * @returns {Array} - List of available collections
 */
export const getSatelliteCollections = () => {
  return [
    { id: 'LANDSAT/LC08/C02/T1_L2', name: 'Landsat 8 Surface Reflectance' },
    { id: 'LANDSAT/LE07/C02/T1_L2', name: 'Landsat 7 Surface Reflectance' },
    { id: 'LANDSAT/LT05/C02/T1_L2', name: 'Landsat 5 Surface Reflectance' },
    { id: 'COPERNICUS/S2_SR', name: 'Sentinel-2 Surface Reflectance' },
    { id: 'MODIS/006/MOD13Q1', name: 'MODIS Vegetation Indices' }
  ];
};

/**
 * Get default index information
 * @returns {Object} - Index information
 */
export const getEventIndices = () => {
  return { 
    name: 'RGB', 
    formula: 'Red, Green, Blue bands', 
    description: 'Default RGB visualization' 
  };
};