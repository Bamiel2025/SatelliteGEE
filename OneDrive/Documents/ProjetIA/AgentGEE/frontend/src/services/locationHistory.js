/**
 * Location history service for storing and retrieving recent locations
 */

const LOCATION_HISTORY_KEY = 'satellite_analyzer_location_history';
const MAX_HISTORY_ITEMS = 15; // Increased from 10 to 15

/**
 * Add a location to history
 * @param {Object} location - Location object to add
 */
export const addLocationToHistory = (location) => {
  try {
    // Get existing history
    const history = getLocationHistory();
    
    // Remove if already exists
    const filteredHistory = history.filter(item => 
      item.display_name !== location.display_name
    );
    
    // Add to beginning
    const newHistory = [location, ...filteredHistory];
    
    // Limit to max items
    const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
    
    // Save to localStorage
    localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.warn('Failed to save location to history:', error);
  }
};

/**
 * Get location history
 * @returns {Array} - Array of location objects
 */
export const getLocationHistory = () => {
  try {
    const history = localStorage.getItem(LOCATION_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Failed to retrieve location history:', error);
    return [];
  }
};

/**
 * Clear location history
 */
export const clearLocationHistory = () => {
  try {
    localStorage.removeItem(LOCATION_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear location history:', error);
  }
};

/**
 * Get recent locations with search term filtering
 * @param {string} searchTerm - Optional search term to filter results
 * @returns {Array} - Filtered array of recent locations
 */
export const getRecentLocations = (searchTerm = '') => {
  const history = getLocationHistory();
  
  if (!searchTerm) {
    return history;
  }
  
  // Filter by search term
  const term = searchTerm.toLowerCase();
  return history.filter(location => 
    location.display_name.toLowerCase().includes(term) ||
    (location.type && location.type.toLowerCase().includes(term)) ||
    (location.address && JSON.stringify(location.address).toLowerCase().includes(term))
  );
};

/**
 * Get recent locations grouped by type
 * @returns {Object} - Object with locations grouped by type
 */
export const getGroupedHistory = () => {
  const history = getLocationHistory();
  
  // Group locations by type
  const grouped = {};
  
  history.forEach(location => {
    const type = location.type || 'Other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(location);
  });
  
  return grouped;
};

/**
 * Get recent locations sorted by usage frequency
 * @returns {Array} - Array of locations sorted by frequency
 */
export const getFrequentLocations = () => {
  const history = getLocationHistory();
  
  // For now, we'll just return the history as is since we don't track frequency
  // In a more advanced implementation, we could track how often each location is used
  return history;
};