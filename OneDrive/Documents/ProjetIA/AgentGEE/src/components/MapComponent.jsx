import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom hook to update the map view when location changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapComponent = ({ beforeImage, afterImage, location, onLocationChange }) => {
  const mapRef = useRef();
  
  // Function to handle map click events
  const handleMapClick = (e) => {
    onLocationChange({
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
  };

  // Effect to add GEE layers to the map
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Clear existing GEE layers
    map.eachLayer((layer) => {
      if (layer.options && layer.options.geeLayer) {
        map.removeLayer(layer);
      }
    });
    
    // Add before image layer if available
    if (beforeImage && beforeImage.mapId) {
      const beforeLayer = L.tileLayer(
        `https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/${beforeImage.mapId}/tiles/{z}/{x}/{y}`,
        {
          attribution: 'Google Earth Engine',
          geeLayer: true,
          opacity: 0.7
        }
      );
      beforeLayer.addTo(map);
    }
    
    // Add after image layer if available
    if (afterImage && afterImage.mapId) {
      const afterLayer = L.tileLayer(
        `https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps/${afterImage.mapId}/tiles/{z}/{x}/{y}`,
        {
          attribution: 'Google Earth Engine',
          geeLayer: true,
          opacity: 0.7
        }
      );
      afterLayer.addTo(map);
    }
  }, [beforeImage, afterImage]);

  return (
    <div className="map">
      <MapContainer 
        center={[location.lat, location.lng]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        ref={(ref) => { mapRef.current = ref; }}
        eventHandlers={{ click: handleMapClick }}
      >
        <ChangeView center={[location.lat, location.lng]} zoom={10} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
      
      <div className="coordinates-display">
        Selected Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </div>
    </div>
  );
};

export default MapComponent;