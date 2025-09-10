import React, { useState, useEffect, useCallback } from 'react';
import SplitMapComponent from './components/SplitMapComponent';
import ControlPanel from './components/ControlPanel';
import AnalysisResults from './components/AnalysisResults';
import MeasurementControls from './components/MeasurementControls';
// Removed EventFilter import
// Removed MeasurementTools import
import { getSatelliteImage, checkAuthStatus, measureArea, measureDistance } from './services/geeService';
import {
  geocodeLocation,
  reverseGeocode,
  validateCoordinates,
  formatCoordinates
} from './services/locationService';
import { addLocationToHistory } from './services/locationHistory';
import L from 'leaflet';
import 'leaflet-geometryutil';

function App() {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to New York
  const [locationName, setLocationName] = useState('New York, USA'); // For user-friendly location input
  const [dates, setDates] = useState({
    before: '2020-01-01',
    after: '2021-01-01'
  });
  // Removed eventType state
  const [measurements, setMeasurements] = useState({
    area: 0,
    distance: 0,
    points: 0
  });
  
  const [previewMeasurement, setPreviewMeasurement] = useState({ value: 0, unit: '' });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50); // Percentage for split position
  const [mapZoom, setMapZoom] = useState(10); // Shared zoom level for both maps
  const [filter, setFilter] = useState('rgb');
  const [measurementMode, setMeasurementMode] = useState('none');

  // Check authentication status on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await checkAuthStatus();
        setAuthStatus(status);

        if (!status.gee_initialized) {
          setError('Google Earth Engine n\'est pas correctement configuré. Veuillez vérifier le guide d\'authentification.');
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setError('Impossible de se connecter au service backend. Veuillez vous assurer que le serveur fonctionne.');
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, []);

  // Reload images when filter changes
  useEffect(() => {
    if (beforeImage || afterImage) {
      handleAnalyze();
    }
  }, [filter]);

  const handleLocationNameChange = async (name) => {
    setLocationName(name);
  };

  const handleLocationSearch = async (name = locationName) => {
    if (!name || name.trim().length === 0) {
      throw new Error('Veuillez saisir un nom de lieu');
    }

    if (name.trim().length < 2) {
      throw new Error('Le nom du lieu doit contenir au moins 2 caractères');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const geocoded = await geocodeLocation(name);
      setLocation({
        lat: geocoded.lat,
        lng: geocoded.lon
      });
      setLocationName(geocoded.display_name);
      
      // Add to location history
      addLocationToHistory(geocoded);
      
      return geocoded;
    } catch (err) {
      // Use the error message from the service if available, otherwise provide a default
      const errorMessage = err.message || 'Échec du géocodage du lieu. Veuillez essayer un autre nom ou entrer les coordonnées directement.';
      setError(errorMessage);
      console.error('Geocoding error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setLocationName(suggestion.display_name);
    setLocation({
      lat: suggestion.lat,
      lng: suggestion.lon
    });
    
    // Add to location history
    addLocationToHistory(suggestion);
  };

  const handleLocationChange = (newLocation) => {
    // Validate coordinates
    if (!validateCoordinates(newLocation.lat, newLocation.lng)) {
      setError('Coordonnées invalides. La latitude doit être entre -90 et 90, la longitude entre -180 et 180.');
      return;
    }
    
    setLocation(newLocation);
    
    // Reverse geocode to get location name
    reverseGeocode(newLocation.lat, newLocation.lng)
      .then(result => {
        setLocationName(result.display_name);
        // Add to location history
        addLocationToHistory({
          ...result,
          lat: newLocation.lat,
          lon: newLocation.lng,
          type: 'Coordinates'
        });
      })
      .catch(err => {
        console.warn('Failed to reverse geocode:', err);
        const formattedCoords = formatCoordinates(newLocation.lat, newLocation.lng);
        setLocationName(formattedCoords);
        // Add to location history
        addLocationToHistory({
          display_name: formattedCoords,
          lat: newLocation.lat,
          lon: newLocation.lng,
          type: 'Coordinates'
        });
      });
  };

  const handleDateChange = (newDates) => {
    setDates(newDates);
  };

  // Removed handleEventTypeChange function

  const handleSplitChange = (position) => {
    setSplitPosition(position);
  };

  const handleAnalyze = async () => {
    // Check if GEE is properly configured
    if (authStatus && !authStatus.gee_initialized) {
      setError('Google Earth Engine n\'est pas correctement configuré. Veuillez vérifier le guide d\'authentification.');
      return;
    }

    // Validate location
    if (!validateCoordinates(location.lat, location.lng)) {
      setError('Coordonnées invalides. Veuillez saisir des valeurs de latitude et longitude valides.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get before image - create a date range (e.g., 3 months around the selected date)
      const beforeStartDate = new Date(dates.before);
      const beforeEndDate = new Date(beforeStartDate);
      beforeEndDate.setMonth(beforeStartDate.getMonth() + 3); // Add 3 months

      // Ensure end date is after start date and handle month rollover issues
      if (beforeEndDate <= beforeStartDate) {
        beforeEndDate.setDate(beforeStartDate.getDate() + 90); // Minimum 90 days
      }

      // Ensure we don't exceed reasonable date ranges
      const maxBeforeEndDate = new Date(beforeStartDate);
      maxBeforeEndDate.setMonth(beforeStartDate.getMonth() + 6); // Max 6 months
      if (beforeEndDate > maxBeforeEndDate) {
        beforeEndDate.setTime(maxBeforeEndDate.getTime());
      }

      const beforeParams = {
        location: { lat: location.lat, lon: location.lng },
        start_date: dates.before,
        end_date: beforeEndDate.toISOString().split('T')[0]
        // Removed event_type parameter
      };

      const beforeResult = await getSatelliteImage(beforeParams, filter);

      // Get after image - create a date range (e.g., 6 months around the selected date for better coverage)
      const afterStartDate = new Date(dates.after);
      const afterEndDate = new Date(afterStartDate);
      afterEndDate.setMonth(afterStartDate.getMonth() + 6); // Add 6 months for better coverage

      // Ensure end date is after start date and handle month rollover issues
      if (afterEndDate <= afterStartDate) {
        afterEndDate.setDate(afterStartDate.getDate() + 180); // Minimum 180 days
      }

      // Ensure we don't exceed reasonable date ranges
      const maxAfterEndDate = new Date(afterStartDate);
      maxAfterEndDate.setFullYear(afterStartDate.getFullYear() + 1); // Max 1 year
      if (afterEndDate > maxAfterEndDate) {
        afterEndDate.setTime(maxAfterEndDate.getTime());
      }

      const afterParams = {
        location: { lat: location.lat, lon: location.lng },
        start_date: dates.after,
        end_date: afterEndDate.toISOString().split('T')[0]
        // Removed event_type parameter
      };
      
      const afterResult = await getSatelliteImage(afterParams, filter);
      
      setBeforeImage(beforeResult);
      setAfterImage(afterResult);
      
      // Measurements will be handled by drawing tools
    } catch (err) {
      let errorMessage = 'Échec de l\'analyse des images. Veuillez réessayer.';

      // Provide more specific error messages based on the error
      if (err.message) {
        if (err.message.includes('GEE not initialized') || err.message.includes('Earth Engine not initialized')) {
          errorMessage = 'Google Earth Engine n\'est pas correctement configuré. Veuillez vérifier le guide d\'authentification.';
        } else if (err.message.includes('Project') && err.message.includes('not found')) {
          errorMessage = 'Projet Google Earth Engine introuvable. Veuillez vérifier votre ID de projet dans le fichier .env.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasurementUpdate = (newMeasurements) => {
    setMeasurements(prev => ({ ...prev, ...newMeasurements }));
  };

  const handlePreviewUpdate = (preview) => {
    setPreviewMeasurement(preview);
  };

  const handlePointsUpdate = useCallback((pointsCount) => {
    setMeasurements(prev => ({ ...prev, points: pointsCount }));
  }, []);

  // Removed clearMeasurementLayers function since it's now in SplitMapComponent

  const handleMeasurementModeChange = useCallback((mode) => {
    setMeasurementMode(mode);
  }, []);

  const handleClearMeasurements = useCallback(() => {
    setMeasurementMode('none');
    setMeasurements({ area: 0, distance: 0, points: 0 });
    setPreviewMeasurement({ value: 0, unit: '' });
  }, []);

  const handleCompleteMeasurement = useCallback(() => {
    // This will be set by SplitMapComponent
    if (window.completeMeasurementCallback) {
      window.completeMeasurementCallback();
    }
    setMeasurementMode('none');
  }, []);

  const handleAreaMeasured = async (geometry) => {
    console.log('Area measured with geometry:', geometry);
    if (!geometry || !geometry.type || !geometry.coordinates) {
      console.error('Invalid geometry for area measurement');
      setError('Invalid measurement geometry. Please try drawing again.');
      return;
    }

    let finalArea = 0;

    try {
      // Try backend first
      const result = await measureArea(geometry);
      console.log('Backend area result:', result);
      if (result && result.area !== undefined && !isNaN(result.area)) {
        finalArea = parseFloat(result.area);
        console.log('Using backend area:', finalArea);
      } else {
        throw new Error('Invalid area result from backend');
      }
    } catch (error) {
      console.error('Backend area measurement failed:', error);
      console.log('Falling back to client-side calculation');
      
      // Client-side fallback
      try {
        let totalArea = 0;
        if (geometry.type === 'Polygon') {
          const coords = geometry.coordinates[0]; // exterior ring
          if (coords.length < 3) throw new Error('Insufficient points for polygon');
          const latlngs = coords.map(coord => L.latLng(coord[1], coord[0]));
          totalArea = L.GeometryUtil.geodesicArea(latlngs) / 1000000; // to km²
        } else if (geometry.type === 'MultiPolygon') {
          for (const poly of geometry.coordinates) {
            const coords = poly[0];
            if (coords.length < 3) continue;
            const latlngs = coords.map(coord => L.latLng(coord[1], coord[0]));
            totalArea += L.GeometryUtil.geodesicArea(latlngs) / 1000000;
          }
        } else {
          throw new Error(`Unsupported geometry type: ${geometry.type}`);
        }
        if (totalArea > 0 && !isNaN(totalArea)) {
          finalArea = totalArea;
          console.log('Client-side area calculated:', finalArea);
        } else {
          throw new Error('Zero or invalid area calculated');
        }
      } catch (fallbackError) {
        console.error('Fallback area calculation failed:', fallbackError);
        setError('Failed to calculate area. Ensure the drawn polygon is closed and valid.');
        return;
      }
    }

    // Update measurements with final value (ensure it overrides any previous value)
    console.log('Final area measurement complete:', finalArea, 'km²');
    setMeasurements(prev => ({
      ...prev,
      area: finalArea,
      points: 0
    }));
  };

  const handleDistanceMeasured = async (geometry) => {
    console.log('Distance measured with geometry:', geometry);
    if (!geometry || !geometry.type || !geometry.coordinates) {
      console.error('Invalid geometry for distance measurement');
      setError('Invalid measurement geometry. Please try drawing again.');
      return;
    }

    let finalDistance = 0;

    try {
      // Try backend first
      const result = await measureDistance(geometry);
      console.log('Backend distance result:', result);
      if (result && result.distance !== undefined && !isNaN(result.distance)) {
        finalDistance = parseFloat(result.distance);
        console.log('Using backend distance:', finalDistance);
      } else {
        throw new Error('Invalid distance result from backend');
      }
    } catch (error) {
      console.error('Backend distance measurement failed:', error);
      console.log('Falling back to client-side calculation');
      
      // Client-side fallback
      try {
        let totalDistance = 0;
        if (geometry.type === 'LineString') {
          const coords = geometry.coordinates;
          if (coords.length < 2) throw new Error('Insufficient points for line');
          const latlngs = coords.map(coord => L.latLng(coord[1], coord[0]));
          for (let i = 1; i < latlngs.length; i++) {
            totalDistance += latlngs[i].distanceTo(latlngs[i - 1]);
          }
        } else if (geometry.type === 'MultiLineString') {
          for (const line of geometry.coordinates) {
            if (line.length < 2) continue;
            const latlngs = line.map(coord => L.latLng(coord[1], coord[0]));
            for (let i = 1; i < latlngs.length; i++) {
              totalDistance += latlngs[i].distanceTo(latlngs[i - 1]);
            }
          }
        } else {
          throw new Error(`Unsupported geometry type: ${geometry.type}`);
        }
        const calculatedDistance = totalDistance / 1000; // to km
        if (calculatedDistance > 0 && !isNaN(calculatedDistance)) {
          finalDistance = calculatedDistance;
          console.log('Client-side distance calculated:', finalDistance);
        } else {
          throw new Error('Zero or invalid distance calculated');
        }
      } catch (fallbackError) {
        console.error('Fallback distance calculation failed:', fallbackError);
        setError('Failed to calculate distance. Ensure the drawn line has at least two points.');
        return;
      }
    }

    // Update measurements with final value (ensure it overrides any previous value)
    console.log('Final distance measurement complete:', finalDistance, 'km');
    setMeasurements(prev => ({
      ...prev,
      distance: finalDistance,
      points: 0
    }));
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Initialisation de l'Analyseur d'Images Satellites...</h2>
          <p>Connexion à Google Earth Engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header">
        <h1>Analyseur d'Images Satellites</h1>
        <p>Comparez des images satellites et analysez les changements environnementaux</p>
        {authStatus && !authStatus.gee_initialized && (
          <div className="auth-warning">
            Attention : Authentification GEE Requise - Voir la Documentation
          </div>
        )}
      </header>
      
      <main className="app-main" id="main-content">
        <ControlPanel
          location={location}
          locationName={locationName}
          dates={dates}
          // Removed locationSuggestions prop
          // Removed eventType prop
          onLocationNameChange={handleLocationNameChange}
          onLocationSearch={handleLocationSearch}
          onSuggestionSelect={handleSuggestionSelect}
          onLocationChange={handleLocationChange}
          onDateChange={handleDateChange}
          // Removed onEventTypeChange prop
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          filter={filter}
          onFilterChange={setFilter}
        />
        
        <div className="map-container">
          <SplitMapComponent
            beforeImage={beforeImage}
            afterImage={afterImage}
            location={location}
            onLocationChange={handleLocationChange}
            splitPosition={splitPosition}
            zoom={mapZoom}
            onZoomChange={setMapZoom}
            measurementMode={measurementMode}
            onAreaMeasured={handleAreaMeasured}
            onDistanceMeasured={handleDistanceMeasured}
            onMeasurementUpdate={handleMeasurementUpdate}
            onPreviewUpdate={handlePreviewUpdate}
            onPointsUpdate={handlePointsUpdate}
            filter={filter}
          />
        </div>
        
        <div className="sidebar">
          {/* Removed EventFilter component */}

          <MeasurementControls
            measurementMode={measurementMode}
            onMeasurementModeChange={handleMeasurementModeChange}
            onClearMeasurements={handleClearMeasurements}
            onCompleteMeasurement={handleCompleteMeasurement}
            previewMeasurement={previewMeasurement}
            measurements={measurements}
          />

          <AnalysisResults
            measurements={measurements}
            filter={filter}
            locationName={locationName}
            location={location}
            dates={dates}
            // Removed eventType prop
          />
        </div>
      </main>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;