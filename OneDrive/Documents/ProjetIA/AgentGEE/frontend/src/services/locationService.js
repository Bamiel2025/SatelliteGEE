/**
 * Enhanced location service with multiple geocoding providers
 */

/**
 * Known locations with precise coordinates for specific sites
 */
const knownLocations = {
  'fagradalsfjall': {
    lat: 63.865,
    lon: -22.3139,
    display_name: 'Fagradalsfjall Volcano, Reykjanes Peninsula, Iceland',
    type: 'volcano',
    description: 'Specific eruption site coordinates'
  },
  'faguibiné': {
    lat: 16.3667,
    lon: -4.0167,
    display_name: 'Lac Faguibiné, Mali',
    type: 'lake',
    description: 'Precise location of Faguibine Lake'
  },
  // Add more known locations as needed
  'amazon': {
    lat: -3.4653,
    lon: -62.2159,
    display_name: 'Amazon Rainforest, South America',
    type: 'forest'
  },
  'sahara': {
    lat: 23.4162,
    lon: 25.6628,
    display_name: 'Sahara Desert, Africa',
    type: 'desert'
  }
};

/**
 * Check if query matches a known location
 * @param {string} query - Location query
 * @returns {Object|null} - Known location data or null
 */
const getKnownLocation = (query) => {
  const lowerQuery = query.toLowerCase().trim();
  for (const [key, location] of Object.entries(knownLocations)) {
    if (lowerQuery.includes(key)) {
      return {
        ...location,
        matchedKey: key
      };
    }
  }
  return null;
};

/**
 * Preprocess location query for better geocoding results
 * @param {string} query - Original location query
 * @returns {Object} - Processed query with name, country, and parameters
 */
const preprocessLocationQuery = (query) => {
  let processedQuery = query.trim();
  let country = null;
  let structuredParams = {};
  let knownLocation = getKnownLocation(processedQuery);

  if (knownLocation) {
    return {
      knownLocation,
      query: processedQuery,
      country: country,
      params: structuredParams
    };
  }

  // Parse country from "(country)" format
  const countryMatch = processedQuery.match(/\(([^)]+)\)$/);
  if (countryMatch) {
    country = countryMatch[1].trim().toLowerCase();
    processedQuery = processedQuery.replace(/\s*\([^)]+\)$/, '').trim();
    // Map country names to ISO codes
    const countryCodes = {
      'france': 'FR', 'espagne': 'ES', 'allemagne': 'DE', 'italie': 'IT',
      'islande': 'IS', 'island': 'IS', 'iceland': 'IS',
      'mali': 'ML', 'maroc': 'MA', 'tunisie': 'TN', 'algérie': 'DZ',
      'usa': 'US', 'états-unis': 'US', 'united states': 'US', 'etats-unis': 'US',
      'royaume-uni': 'GB', 'uk': 'GB', 'england': 'GB', 'japon': 'JP'
    };
    structuredParams.countrycodes = countryCodes[country] || country.toUpperCase();
  }

  // Translate common French geographic terms to English
  const frenchToEnglish = {
    'volcan': 'volcano',
    'lac': 'lake',
    'rivière': 'river',
    'montagne': 'mountain',
    'forêt': 'forest',
    'désert': 'desert',
    'île': 'island',
    'plage': 'beach',
    'ville': 'city',
    'pays': 'country'
  };

  // Replace French terms if they appear as whole words
  Object.entries(frenchToEnglish).forEach(([french, english]) => {
    const regex = new RegExp(`\\b${french}\\b`, 'gi');
    if (regex.test(processedQuery)) {
      processedQuery = processedQuery.replace(regex, english);
    }
  });

  // Basic spell corrections for known misspellings
  const spellCorrections = {
    'fragadasfall': 'fagradalsfjall',
    'faguibine': 'faguibiné'  // Add accent if needed
  };

  Object.entries(spellCorrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    processedQuery = processedQuery.replace(regex, correct);
  });

  // Check known locations again after processing
  knownLocation = getKnownLocation(processedQuery);
  if (knownLocation) {
    return {
      knownLocation,
      query: processedQuery,
      country: country,
      params: structuredParams
    };
  }

  return {
    knownLocation: null,
    query: processedQuery,
    country: country,
    params: structuredParams
  };
};

/**
 * Geocode a location name to coordinates using multiple providers
 * @param {string} locationName - Name of the location
 * @returns {Promise<Object>} - Geocoded location with multiple fallbacks
 */
export const geocodeLocation = async (locationName) => {
  const processed = preprocessLocationQuery(locationName);
  
  // If we have a known location, return it directly
  if (processed.knownLocation) {
    console.log(`Using known location for: ${locationName}`);
    return {
      ...processed.knownLocation,
      provider: 'KnownLocation',
      query: locationName,
      originalQuery: locationName,
      processedQuery: processed.query
    };
  }
  
  // Try multiple geocoding services in order of preference
  const providers = [
    { func: geocodeOpenStreetMap, name: 'OpenStreetMap' },
    { func: geocodeNominatim, name: 'Nominatim' },
    { func: geocodeGoogleFallback, name: 'GoogleFallback' }
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      const result = await provider.func(processed.query, processed.params);
      if (result) {
        return {
          ...result,
          provider: provider.name,
          query: locationName,
          originalQuery: locationName,
          processedQuery: processed.query
        };
      }
    } catch (error) {
      console.warn(`Geocoding failed with ${provider.name}:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }
  
  // Create a more user-friendly error message
  let errorMessage = 'Location not found. ';
  
  if (lastError && lastError.message) {
    if (lastError.message.includes('No results found')) {
      errorMessage += 'Please try a different location name or check spelling. Tried: ' + processed.query;
    } else if (lastError.message.includes('NetworkError') || lastError.message.includes('fetch')) {
      errorMessage += 'Please check your internet connection and try again.';
    } else {
      errorMessage += 'Please try again or enter coordinates directly.';
    }
  } else {
    errorMessage += 'Please try a different location name or enter coordinates directly. Tried: ' + processed.query;
  }
  
  throw new Error(errorMessage);
};

/**
 * Geocode using OpenStreetMap Nominatim
 * @param {string} locationName - Location name
 * @param {Object} structuredParams - Additional parameters like countrycodes
 */
const geocodeOpenStreetMap = async (locationName, structuredParams = {}) => {
  const url = "https://nominatim.openstreetmap.org/search";
  const params = {
    q: locationName,
    format: 'json',
    limit: 10,
    addressdetails: 1,
    ...structuredParams
  };

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
      headers: {
        'User-Agent': 'Satellite-Image-Analyzer/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Rate limited by geocoding service. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Geocoding service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Geocoding service error: ${response.status}`);
      }
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No results found');
    }

    // Return the most relevant result
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      boundingbox: result.boundingbox,
      type: result.type,
      importance: result.importance,
      address: result.address
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request timed out. Please try again.');
    }
    throw error;
  }
};

/**
 * Geocode using a different Nominatim instance
 * @param {string} locationName - Location name
 * @param {Object} structuredParams - Additional parameters like countrycodes
 */
const geocodeNominatim = async (locationName, structuredParams = {}) => {
  const url = "https://nominatim.geocoding.ai/search.php";
  const params = {
    q: locationName,
    format: 'json',
    limit: 10,
    ...structuredParams
  };

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Rate limited by geocoding service. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Geocoding service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Geocoding service error: ${response.status}`);
      }
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No results found');
    }

    // Return the most relevant result
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      boundingbox: result.boundingbox,
      type: result.type,
      address: result.address
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request timed out. Please try again.');
    }
    throw error;
  }
};

/**
 * Fallback geocoding using enhanced known locations and mock service
 * @param {string} locationName - Location name
 * @param {Object} structuredParams - Additional parameters
 */
const geocodeGoogleFallback = async (locationName, structuredParams = {}) => {
  // First check known locations (already checked in preprocess, but for completeness)
  const processed = preprocessLocationQuery(locationName);
  if (processed.knownLocation) {
    return processed.knownLocation;
  }

  // This is a mock implementation - in a real app, you would use the Google Maps API
  // For demonstration purposes, we'll return a fixed location if certain keywords are used
  
  const mockLocations = {
    'paris': { lat: 48.8566, lon: 2.3522, display_name: 'Paris, France', type: 'city' },
    'london': { lat: 51.5074, lon: -0.1278, display_name: 'London, UK', type: 'city' },
    'new york': { lat: 40.7128, lon: -74.0060, display_name: 'New York, USA', type: 'city' },
    'tokyo': { lat: 35.6762, lon: 139.6503, display_name: 'Tokyo, Japan', type: 'city' },
    'amazon': { lat: -3.4653, lon: -62.2159, display_name: 'Amazon Rainforest, South America', type: 'forest' },
    'sahara': { lat: 23.4162, lon: 25.6628, display_name: 'Sahara Desert, Africa', type: 'desert' }
  };
  
  const key = locationName.toLowerCase();
  for (const [pattern, location] of Object.entries(mockLocations)) {
    if (key.includes(pattern)) {
      return location;
    }
  }
  
  throw new Error('Location not found in mock database');
};

/**
 * Reverse geocode coordinates to location name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Reverse geocoded location
 */
export const reverseGeocode = async (lat, lon) => {
  const url = "https://nominatim.openstreetmap.org/reverse";
  const params = {
    lat: lat,
    lon: lon,
    format: 'json'
  };
  
  const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
    headers: {
      'User-Agent': 'Satellite-Image-Analyzer/1.0'
    }
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Rate limited by geocoding service. Please wait a moment and try again.');
    } else if (response.status >= 500) {
      throw new Error('Geocoding service temporarily unavailable. Please try again later.');
    } else {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
  }
  
  const data = await response.json();
  
  if (!data || !data.display_name) {
    throw new Error('No results found for these coordinates');
  }
  
  return {
    lat: parseFloat(data.lat),
    lon: parseFloat(data.lon),
    display_name: data.display_name,
    address: data.address
  };
};

/**
 * Get location suggestions as user types with enhanced filtering
 * @param {string} query - Partial location name
 * @returns {Promise<Array>} - Array of location suggestions
 */
export const getLocationSuggestions = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }

  const processed = preprocessLocationQuery(query);
  
  try {
    const url = "https://nominatim.openstreetmap.org/search";
    const params = {
      q: processed.query,
      format: 'json',
      limit: 15,
      addressdetails: 1,
      ...processed.params
    };
    
    const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
      headers: {
        'User-Agent': 'Satellite-Image-Analyzer/1.0'
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    // Filter and enhance results
    const filteredResults = data
      .filter(item => item.display_name && item.lat && item.lon)
      .map(item => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        type: getItemType(item),
        importance: item.importance || 0,
        address: item.address,
        processedQuery: processed.query
      }))
      // Sort by importance
      .sort((a, b) => b.importance - a.importance)
      // Limit to top results
      .slice(0, 10);
    
    return filteredResults;
  } catch (error) {
    console.warn('Location suggestions failed:', error.message);
    return [];
  }
};

/**
 * Determine item type for better categorization
 * @param {Object} item - Location item from geocoding service
 * @returns {string} - Enhanced type classification
 */
const getItemType = (item) => {
  // Use the provided type if available
  if (item.type) {
    const type = item.type.toLowerCase();
    if (['city', 'town', 'village', 'hamlet'].includes(type)) return 'City';
    if (['country', 'state', 'province', 'region'].includes(type)) return 'Region';
    if (['river', 'stream', 'lake', 'ocean', 'sea'].includes(type)) return 'Water';
    if (['mountain', 'peak', 'hill'].includes(type)) return 'Mountain';
    if (['forest', 'park', 'nature'].includes(type)) return 'Nature';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  // Fallback to address details
  const address = item.address || {};
  if (address.city || address.town || address.village) return 'City';
  if (address.country) return 'Country';
  if (address.state || address.province) return 'Region';
  
  return 'Location';
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} - Whether coordinates are valid
 */
export const validateCoordinates = (lat, lon) => {
  return (
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} - Formatted coordinates
 */
export const formatCoordinates = (lat, lon) => {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};