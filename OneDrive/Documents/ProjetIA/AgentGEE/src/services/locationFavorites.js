/**
 * Location favorites service for storing and retrieving favorite locations
 */

const LOCATION_FAVORITES_KEY = 'satellite_analyzer_location_favorites';

/**
 * Add a location to favorites
 * @param {Object} location - Location object to add
 */
export const addLocationToFavorites = (location) => {
  try {
    // Get existing favorites
    const favorites = getLocationFavorites();
    
    // Check if already exists
    const existingIndex = favorites.findIndex(item => 
      item.display_name === location.display_name
    );
    
    if (existingIndex === -1) {
      // Add to favorites
      const newFavorites = [...favorites, location];
      localStorage.setItem(LOCATION_FAVORITES_KEY, JSON.stringify(newFavorites));
      return true;
    }
    
    return false; // Already exists
  } catch (error) {
    console.warn('Failed to add location to favorites:', error);
    return false;
  }
};

/**
 * Remove a location from favorites
 * @param {string} locationName - Name of the location to remove
 */
export const removeLocationFromFavorites = (locationName) => {
  try {
    // Get existing favorites
    const favorites = getLocationFavorites();
    
    // Filter out the location
    const newFavorites = favorites.filter(item => 
      item.display_name !== locationName
    );
    
    // Save updated favorites
    localStorage.setItem(LOCATION_FAVORITES_KEY, JSON.stringify(newFavorites));
    return true;
  } catch (error) {
    console.warn('Failed to remove location from favorites:', error);
    return false;
  }
};

/**
 * Get location favorites
 * @returns {Array} - Array of favorite location objects
 */
export const getLocationFavorites = () => {
  try {
    const favorites = localStorage.getItem(LOCATION_FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.warn('Failed to retrieve location favorites:', error);
    return [];
  }
};

/**
 * Check if a location is in favorites
 * @param {string} locationName - Name of the location to check
 * @returns {boolean} - Whether the location is in favorites
 */
export const isLocationFavorite = (locationName) => {
  try {
    const favorites = getLocationFavorites();
    return favorites.some(item => item.display_name === locationName);
  } catch (error) {
    console.warn('Failed to check if location is favorite:', error);
    return false;
  }
};

/**
 * Toggle favorite status of a location
 * @param {Object} location - Location object to toggle
 * @returns {boolean} - New favorite status
 */
export const toggleLocationFavorite = (location) => {
  try {
    if (isLocationFavorite(location.display_name)) {
      removeLocationFromFavorites(location.display_name);
      return false;
    } else {
      addLocationToFavorites(location);
      return true;
    }
  } catch (error) {
    console.warn('Failed to toggle location favorite:', error);
    return false;
  }
};