import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geometryutil';

// Custom hook to update the map view when location changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    if (map && center && zoom && (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1] || zoom !== prevZoom.current)) {
      map.setView(center, zoom, { animate: false });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

// Custom component to synchronize map movements with debouncing to prevent infinite loops
function MapSync({ mapRef, otherMapRef, onZoomChange, isMeasuringRef }) {
  const map = useMap();
  const isSyncing = useRef(false);

  useEffect(() => {
    // Store references to the maps
    if (mapRef) {
      mapRef.current = map;
    }

    // Wait for both maps to be available
    if (!map || !otherMapRef || !otherMapRef.current) return;

    const onMoveEnd = () => {
      if (!otherMapRef.current || isSyncing.current || isMeasuringRef.current) return;

      isSyncing.current = true;

      const center = map.getCenter();
      const zoom = map.getZoom();

      // Update the shared zoom state
      if (onZoomChange) {
        onZoomChange(zoom);
      }

      // Update the other map to match this map's view
      otherMapRef.current.setView(center, zoom, {
        animate: false,
        pan: { animate: false }
      });

      // Reset flag after a short delay
      setTimeout(() => {
        isSyncing.current = false;
      }, 100);
    };

    const onOtherMapMoveEnd = () => {
      if (!map || isSyncing.current || isMeasuringRef.current) return;

      isSyncing.current = true;

      const center = otherMapRef.current.getCenter();
      const zoom = otherMapRef.current.getZoom();

      // Update the shared zoom state
      if (onZoomChange) {
        onZoomChange(zoom);
      }

      // Update this map to match the other map's view
      map.setView(center, zoom, {
        animate: false,
        pan: { animate: false }
      });

      // Reset flag after a short delay
      setTimeout(() => {
        isSyncing.current = false;
      }, 100);
    };

    // Listen for moveend events instead of move to avoid infinite loops during panning/zooming
    map.on('moveend', onMoveEnd);
    otherMapRef.current.on('moveend', onOtherMapMoveEnd);

    // Cleanup
    return () => {
      map.off('moveend', onMoveEnd);
      if (otherMapRef.current) {
        otherMapRef.current.off('moveend', onOtherMapMoveEnd);
      }
    };
  }, [map, mapRef, otherMapRef, onZoomChange, isMeasuringRef]);

  return null;
}

const SplitMapComponent = ({ beforeImage, afterImage, location, onLocationChange, splitPosition, zoom, onZoomChange, measurementMode, onAreaMeasured, onDistanceMeasured, filter, onMeasurementUpdate, onPreviewUpdate, onPointsUpdate }) => {
  const beforeMapRef = useRef();
  const afterMapRef = useRef();
  const beforeLayerGroup = useRef(L.featureGroup());
  const afterLayerGroup = useRef(L.featureGroup());
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [previewMeasurement, setPreviewMeasurement] = useState({ value: 0, unit: '' });
  const [currentTooltip, setCurrentTooltip] = useState(null);
  const isMeasuringRef = useRef(false);
  const [mapError, setMapError] = useState(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);


  // Update loading state when images change
  useEffect(() => {
    if (beforeImage || afterImage) {
      setIsLoadingImages(true);
      // Reset loading after a delay to allow layers to load
      const timer = setTimeout(() => setIsLoadingImages(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsLoadingImages(false);
    }
  }, [beforeImage, afterImage]);

  // Clear measurement layers and points
  const clearMeasurementLayers = () => {
    console.log('Clearing all measurement layers and tooltips');
    
    // Clear all layer groups
    if (beforeLayerGroup.current) {
      beforeLayerGroup.current.clearLayers();
      console.log('Cleared before layer group');
    }
    if (afterLayerGroup.current) {
      afterLayerGroup.current.clearLayers();
      console.log('Cleared after layer group');
    }
    
    // Remove tooltip from both maps if it exists
    if (currentTooltip) {
      console.log('Removing tooltip from maps');
      if (beforeMapRef.current) {
        beforeMapRef.current.removeLayer(currentTooltip);
      }
      if (afterMapRef.current) {
        afterMapRef.current.removeLayer(currentTooltip);
      }
      setCurrentTooltip(null);
    }
    
    // Clear measurement points state
    setMeasurementPoints([]);
    console.log('Cleared measurement points state');
    
    // Force re-render to ensure state is updated
    // Also clear any potential lingering elements
    if (beforeMapRef.current) {
      beforeMapRef.current.eachLayer(layer => {
        if (layer instanceof L.Tooltip || layer._path && layer.options.className?.includes('measurement')) {
          beforeMapRef.current.removeLayer(layer);
        }
      });
    }
    if (afterMapRef.current) {
      afterMapRef.current.eachLayer(layer => {
        if (layer instanceof L.Tooltip || layer._path && layer.options.className?.includes('measurement')) {
          afterMapRef.current.removeLayer(layer);
        }
      });
    }
    
    console.log('All measurement elements cleared');
  };

  // Reset points when mode changes
  useEffect(() => {
    if (measurementMode === 'none') {
      clearMeasurementLayers();
    } else {
      // Always start fresh when entering measurement mode
      clearMeasurementLayers();
      setMeasurementPoints([]);
      console.log('Starting new measurement in mode:', measurementMode);
    }
    isMeasuringRef.current = measurementMode !== 'none';
  }, [measurementMode]);

  // Function to handle location clicks (only in none mode)
  const handleLocationClick = (e) => {
    if (measurementMode === 'none') {
      onLocationChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  };

  // Function to calculate preview measurement
  const calculatePreviewMeasurement = useCallback((points, mode) => {
    if (points.length < 2) {
      setPreviewMeasurement({ value: 0, unit: mode === 'area' ? 'km²' : 'km' });
      return;
    }

    let value = 0;
    let unit = mode === 'area' ? 'km²' : 'km';

    if (mode === 'distance') {
      let totalDistance = 0;
      for (let i = 1; i < points.length; i++) {
        totalDistance += points[i - 1].distanceTo(points[i]);
      }
      value = totalDistance / 1000; // Convert to km
    } else if (mode === 'area' && points.length >= 3) {
      const latlngs = points.map(p => L.latLng(p.lat, p.lng));
      value = L.GeometryUtil.geodesicArea(latlngs) / 1000000; // Convert to km²
    }

    setPreviewMeasurement({ value, unit });
    console.log(`Preview ${mode} measurement:`, value.toFixed(3), unit);
  }, [L]);

  // Function to handle measurement clicks
  const handleMeasurementClick = (e, mapInstance) => {
    if (measurementMode === 'none') return;

    console.log('Measurement click at:', e.latlng, 'Mode:', measurementMode);
    
    const newPoint = e.latlng;
    setMeasurementPoints(prev => [...prev, newPoint]);
  };

  // Draw preview on a map (no tooltips during active measurement)
  const drawOnMap = (mapRef, layerGroup, points, mode) => {
    if (!mapRef.current || !layerGroup.current || points.length === 0) {
      console.log('Cannot draw - missing map, layer group, or points');
      return;
    }

    console.log('Drawing on map with', points.length, 'points in', mode, 'mode');

    layerGroup.current.clearLayers();

    if (points.length === 1) {
      // Single point marker
      const marker = L.marker(points[0], {
        icon: L.divIcon({
          className: 'measurement-marker',
          html: '<div style="background: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(layerGroup.current);
      console.log('Added single point marker');
    } else if (mode === 'distance') {
      // Polyline for distance (no tooltip during active measurement)
      const polyline = L.polyline(points, {
        color: '#ff7800',
        weight: 4,
        opacity: 0.9
      }).addTo(layerGroup.current);
      console.log('Added distance polyline');
    } else if (mode === 'area' && points.length >= 3) {
      // Close polygon with first point (no tooltip during active measurement)
      const closedPoints = [...points, points[0]];
      const polygon = L.polygon(closedPoints, {
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
        fillColor: '#3388ff',
        fillOpacity: 0.3
      }).addTo(layerGroup.current);
      console.log('Added area polygon');
    } else if (mode === 'area') {
      // Polyline preview for area until closed (no tooltip)
      const polyline = L.polyline(points, {
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(layerGroup.current);
      console.log('Added area preview polyline');
    }
  };

  // Draw preview on both maps
  const drawMeasurementPreview = useCallback(() => {
    drawOnMap(beforeMapRef, beforeLayerGroup, measurementPoints, measurementMode);
    drawOnMap(afterMapRef, afterLayerGroup, measurementPoints, measurementMode);
  }, [measurementPoints, measurementMode]);

  // Function to complete measurement (for button)
  const completeMeasurement = useCallback(() => {
    console.log('=== COMPLETE MEASUREMENT BUTTON CLICKED ===');
    console.log('Current measurementMode:', measurementMode);
    console.log('Current measurementPoints length:', measurementPoints.length);
    
    if (measurementMode === 'none' || measurementPoints.length < (measurementMode === 'area' ? 3 : 2)) {
      console.log('Complete measurement ignored - invalid mode or insufficient points');
      return;
    }

    // Calculate final measurement value
    let finalValue = 0;
    let unit = '';
    
    if (measurementMode === 'area') {
      console.log('Processing area measurement');
      const latlngs = measurementPoints.map(p => L.latLng(p.lat, p.lng));
      const area = L.GeometryUtil.geodesicArea(latlngs);
      finalValue = area / 1000000; // km²
      unit = 'km²';
      
      // Create geometry for backend
      const coordinates = measurementPoints.map(p => [p.lng, p.lat]);
      coordinates.push(coordinates[0]);
      onAreaMeasured({ type: 'Polygon', coordinates: [coordinates] });
    } else if (measurementMode === 'distance') {
      console.log('Processing distance measurement');
      let totalDistance = 0;
      for (let i = 1; i < measurementPoints.length; i++) {
        totalDistance += measurementPoints[i - 1].distanceTo(measurementPoints[i]);
      }
      finalValue = totalDistance / 1000; // km
      unit = 'km';
      
      // Create geometry for backend
      const coordinates = measurementPoints.map(p => [p.lng, p.lat]);
      onDistanceMeasured({ type: 'LineString', coordinates });
    }

    // Update parent state with final measurement immediately
    if (onMeasurementUpdate) {
      const measurementType = measurementMode === 'area' ? 'area' : 'distance';
      onMeasurementUpdate({
        [measurementType]: finalValue
      });
    }

    // Also trigger the backend measurement which has its own state update
    if (measurementMode === 'area') {
      const coordinates = measurementPoints.map(p => [p.lng, p.lat]);
      coordinates.push(coordinates[0]);
      onAreaMeasured({ type: 'Polygon', coordinates: [coordinates] });
    } else if (measurementMode === 'distance') {
      const coordinates = measurementPoints.map(p => [p.lng, p.lat]);
      onDistanceMeasured({ type: 'LineString', coordinates });
    }

    // Return to none mode to hide instructions
    // The parent will handle this through the measurement callbacks
    isMeasuringRef.current = false;
    
    // Clear the current measurement points
    setMeasurementPoints([]);
    setPreviewMeasurement({ value: 0, unit: '' });
    
    console.log('Measurement completed:', finalValue, unit);
    console.log('=== COMPLETE MEASUREMENT PROCESSING COMPLETE ===');
  }, [measurementPoints, measurementMode, onAreaMeasured, onDistanceMeasured, onMeasurementUpdate, previewMeasurement]);

  // Expose completeMeasurement function globally for MeasurementControls
  useEffect(() => {
    window.completeMeasurementCallback = completeMeasurement;
    return () => {
      delete window.completeMeasurementCallback;
    };
  }, [completeMeasurement]);

  // Update parent with points count when measurement points change
  useEffect(() => {
    if (onPointsUpdate) {
      onPointsUpdate(measurementPoints.length);
    }
  }, [measurementPoints, onPointsUpdate]);

  // Update parent with preview measurement when local preview changes
  useEffect(() => {
    if (onPreviewUpdate) {
      onPreviewUpdate(previewMeasurement);
    }
  }, [previewMeasurement, onPreviewUpdate]);

  // Calculate preview measurement when points or mode change
  useEffect(() => {
    if (measurementPoints.length > 0) {
      calculatePreviewMeasurement(measurementPoints, measurementMode);
    } else {
      setPreviewMeasurement({ value: 0, unit: '' });
    }
  }, [measurementPoints, measurementMode]);

  useEffect(() => {
    drawMeasurementPreview();
  }, [drawMeasurementPreview]);

  // Handle double-click to complete measurement
  const handleDoubleClick = (e) => {
    console.log('=== DOUBLE-CLICK EVENT FIRED ===');
    completeMeasurement();
  };

  // Add event listeners to both maps
  useEffect(() => {
    const addEventListeners = (mapRef) => {
      if (!mapRef.current) return;

      const map = mapRef.current;

      // Always add double-click for completion
      map.on('dblclick', handleDoubleClick);

      if (measurementMode === 'none') {
        map.on('click', handleLocationClick);
      } else {
        map.on('click', (e) => handleMeasurementClick(e, map));
        map.off('click', handleLocationClick);
      }

      return () => {
        map.off('dblclick', handleDoubleClick);
        map.off('click', handleLocationClick);
        map.off('click', handleMeasurementClick);
      };
    };

    const cleanupBefore = addEventListeners(beforeMapRef);
    const cleanupAfter = addEventListeners(afterMapRef);

    return () => {
      cleanupBefore?.();
      cleanupAfter?.();
    };
  }, [measurementMode, measurementPoints, handleDoubleClick, handleLocationClick, handleMeasurementClick, completeMeasurement]);

  // Legend Control component for NDVI/NDWI filters
  const LegendControl = ({ filter }) => {
    const map = useMap();

    useEffect(() => {
      if (filter !== 'ndvi' && filter !== 'ndwi') return;

      let legend = null;

      const addLegend = () => {
        if (legend) map.removeControl(legend);

        legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
          const div = L.DomUtil.create('div', 'info legend');
          div.style.background = 'rgba(255, 255, 255, 0.9)';
          div.style.padding = '10px';
          div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
          div.style.border = '1px solid #ccc';
          div.style.borderRadius = '8px';
          div.style.fontSize = '11px';
          div.style.lineHeight = '16px';
          div.style.minWidth = '120px';
          div.style.zIndex = '1001';
          div.style.fontFamily = 'Arial, sans-serif';

          const title = filter === 'ndvi' ? 'NDVI' : 'NDWI';
          const from = -1;
          const to = 1;
          const step = 0.25;
          const palette = filter === 'ndvi' ? ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'] : ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43'];

          const labels = [`<div style="text-align: center; font-weight: bold; margin-bottom: 5px;">${title}</div>`];
          for (let i = from; i < to; i += step) {
            const next = Math.min(i + step, to);
            const gradient = palette[Math.floor((i + 1) * 4)]; // Approximate gradient selection
            labels.push(
              `<div style="margin: 2px 0;">
                <i style="background: linear-gradient(to right, ${gradient}, ${palette[Math.floor((next + 1) * 4)] || gradient}); width: 100px; height: 15px; display: inline-block; vertical-align: middle; border: 1px solid #999; opacity: 0.8;"></i>
                <span style="margin-left: 5px; font-size: 10px;">${i.toFixed(2)} - ${next.toFixed(2)}</span>
              </div>`
            );
          }

          div.innerHTML = labels.join('');
          return div;
        };

        legend.addTo(map);
      };

      map.whenReady(addLegend);

      // Re-add if filter changes while map is ready
      const handleFilterChange = () => addLegend();
      map.on('load', handleFilterChange);

      return () => {
        if (legend) {
          map.removeControl(legend);
        }
        map.off('load', handleFilterChange);
      };
    }, [filter, map]);

    return null;
  };

  // Satellite layer component for react-leaflet
  const SatelliteLayer = ({ mapId, token, label }) => {
    // Build the tile URL
    let tileUrl = `https://earthengine.googleapis.com/v1/${mapId}/tiles/{z}/{x}/{y}`;
    if (token && token !== '') {
      tileUrl += `?token=${token}`;
    }

    console.log(`${label} tile URL:`, tileUrl);

    return (
      <TileLayer
        url={tileUrl}
        attribution='Google Earth Engine'
        opacity={1.0}
        zIndex={1000}
        maxZoom={18}
        minZoom={0}
        eventHandlers={{
          load: () => {
            console.log(`${label} layer loaded successfully`);
            setIsLoadingImages(false);
            setMapError(null);
          },
          loading: (e) => {
            console.log(`${label} layer loading...`);
          },
          error: (e) => {
            console.error(`${label} layer error:`, e);
            setMapError(`Erreur de chargement de l'image ${label.toLowerCase()}`);
          },
          tileload: (e) => {
            console.log(`${label} tile loaded:`, e.url);
          },
          tileerror: (e) => {
            console.error(`${label} tile error:`, e.url);
          }
        }}
        errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      />
    );
  };

  // Add layer groups when maps are ready
  useEffect(() => {
    const addLayerGroups = () => {
      if (beforeMapRef.current && beforeLayerGroup.current) {
        if (!beforeMapRef.current.hasLayer(beforeLayerGroup.current)) {
          beforeLayerGroup.current.addTo(beforeMapRef.current);
          console.log('Before layer group added to map');
        }
      }
      if (afterMapRef.current && afterLayerGroup.current) {
        if (!afterMapRef.current.hasLayer(afterLayerGroup.current)) {
          afterLayerGroup.current.addTo(afterMapRef.current);
          console.log('After layer group added to map');
        }
      }
    };

    // Try to add immediately if maps are ready
    addLayerGroups();

    // Also try after a short delay in case maps aren't fully ready
    const timer = setTimeout(addLayerGroups, 1000);

    return () => clearTimeout(timer);
  }, [beforeImage, afterImage]);

  return (
    <div className={`split-map-container ${measurementMode !== 'none' ? 'measuring-mode' : ''}`}>
      {/* Loading Overlay */}
      {isLoadingImages && (
        <div className="map-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Chargement des images satellites...</p>
          <p style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '0.5rem' }}>
            Cela peut prendre quelques instants
          </p>
        </div>
      )}

      {/* Before Map */}
      <div
        className={`map-half before-map ${measurementMode !== 'none' ? 'measuring' : ''}`}
        style={{ width: `${splitPosition}%` }}
      >
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={beforeMapRef}
        >
          <ChangeView center={[location.lat, location.lng]} zoom={zoom} />
          <MapSync mapRef={beforeMapRef} otherMapRef={afterMapRef} onZoomChange={onZoomChange} isMeasuringRef={isMeasuringRef} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {beforeImage && beforeImage.map_id && (
            <SatelliteLayer
              mapId={beforeImage.map_id}
              token={beforeImage.token}
              label="Avant"
            />
          )}
          <LegendControl filter={filter} />
        </MapContainer>
        <div className="map-label before-label">Avant</div>
      </div>
      
      {/* Divider */}
      <div className="map-divider" style={{ left: `${splitPosition}%` }}></div>
      
      {/* After Map */}
      <div
        className={`map-half after-map ${measurementMode !== 'none' ? 'measuring' : ''}`}
        style={{ width: `${100 - splitPosition}%` }}
      >
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={afterMapRef}
        >
          <ChangeView center={[location.lat, location.lng]} zoom={zoom} />
          <MapSync mapRef={afterMapRef} otherMapRef={beforeMapRef} onZoomChange={onZoomChange} isMeasuringRef={isMeasuringRef} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {afterImage && afterImage.map_id && (
            <SatelliteLayer
              mapId={afterImage.map_id}
              token={afterImage.token}
              label="Après"
            />
          )}
          <LegendControl filter={filter} />
        </MapContainer>
        <div className="map-label after-label">Après</div>
      </div>
      
      <div className="coordinates-display">
        Lieu Sélectionné : {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </div>

      {mapError && (
        <div className="map-error-message">
          {mapError}
          <br />
          <small>💡 Vérifiez la console du navigateur pour plus de détails</small>
        </div>
      )}
    </div>
  );
};

export default SplitMapComponent;