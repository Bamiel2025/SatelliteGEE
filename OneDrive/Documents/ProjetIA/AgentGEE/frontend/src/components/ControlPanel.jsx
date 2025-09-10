import React, { useState, useEffect, useRef } from 'react';
import { getLocationHistory, clearLocationHistory } from '../services/locationHistory';

const ControlPanel = ({
  location,
  locationName,
  dates,
  filter,
  onLocationNameChange,
  onLocationSearch,
  onSuggestionSelect,
  onLocationChange,
  onDateChange,
  onFilterChange,
  onAnalyze,
  isLoading
}) => {
  const [localLocationName, setLocalLocationName] = useState(locationName);
  const [localLocation, setLocalLocation] = useState({
    lat: location.lat,
    lng: location.lng
  });
  
  const [localDates, setLocalDates] = useState(dates);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState(null);
  const locationInputRef = useRef(null);
  const suggestionsListRef = useRef(null);

  // Load location history on component mount
  useEffect(() => {
    setLocationHistory(getLocationHistory());
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const suggestions = [];
    if (!localLocationName) {
      // When no search term, show history
      suggestions.push(...locationHistory);
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          handleSuggestionSelection(suggestions[activeSuggestionIndex]);
        } else if (localLocationName && localLocationName.trim().length > 0) {
          handleLocationSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        locationInputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleLocationNameChange = (e) => {
    const value = e.target.value;
    setLocalLocationName(value);
    onLocationNameChange(value);

    // Reset active suggestion index when typing
    setActiveSuggestionIndex(-1);

    // Show suggestions when there's text, hide when empty
    setShowSuggestions(value.length > 0);

    // Clear any previous search errors
    setLocationSearchError(null);
  };

  const handleLocationSearchSubmit = () => {
    if (!localLocationName || localLocationName.trim().length === 0) {
      setLocationSearchError('Veuillez saisir un nom de lieu');
      return;
    }

    if (localLocationName.length < 2) {
      setLocationSearchError('Le nom du lieu doit contenir au moins 2 caractères');
      return;
    }
    
    setIsLocationSearching(true);
    setLocationSearchError(null);
    
    // Call the search function directly
    onLocationSearch(localLocationName)
      .then(() => {
        setIsLocationSearching(false);
        setShowSuggestions(false);
      })
      .catch((error) => {
        setIsLocationSearching(false);
        // Provide more user-friendly error messages
        if (error.message) {
          setLocationSearchError(error.message);
        } else {
          setLocationSearchError('Échec de la recherche du lieu. Veuillez vérifier votre connexion internet ou essayer d\'entrer les coordonnées directement.');
        }
      });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLocationSearchSubmit();
  };

  const handleSuggestionSelection = (suggestion) => {
    setLocalLocationName(suggestion.display_name);
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    locationInputRef.current?.focus();
    
    // Clear any previous search errors
    setLocationSearchError(null);
  };

  const handleHistoryItemClick = (historyItem) => {
    handleSuggestionSelection(historyItem);
  };

  const handleClearHistory = () => {
    clearLocationHistory();
    setLocationHistory([]);
  };


  const handleLocationSubmit = (e) => {
    e.preventDefault();
    onLocationChange({
      lat: parseFloat(localLocation.lat),
      lng: parseFloat(localLocation.lng)
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newDates = { ...localDates, [name]: value };
    setLocalDates(newDates);
    onDateChange(newDates);
  };

  // Handle clicking outside to close suggestions
  const handleBlur = () => {
    // Use a timeout to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }, 150);
  };

  // Show history when input is focused and no search term
  const handleFocus = () => {
    if (!localLocationName) {
      setLocationHistory(getLocationHistory());
      setShowSuggestions(true);
    } else if (localLocationName.length > 0) {
      setShowSuggestions(true);
    }
    setActiveSuggestionIndex(-1);

    // Clear any previous search errors when focusing
    setLocationSearchError(null);
  };

  // Get icon based on location type
  const getLocationIcon = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('city') || typeLower.includes('town')) return '🏙️';
    if (typeLower.includes('village')) return '🏘️';
    if (typeLower.includes('country')) return '🌍';
    if (typeLower.includes('state') || typeLower.includes('province')) return '🏛️';
    if (typeLower.includes('mountain') || typeLower.includes('peak')) return '⛰️';
    if (typeLower.includes('forest') || typeLower.includes('wood')) return '🌲';
    if (typeLower.includes('lake') || typeLower.includes('water')) return '💧';
    if (typeLower.includes('river')) return '🌊';
    if (typeLower.includes('desert')) return '🏜️';
    if (typeLower.includes('island')) return '🏝️';
    if (typeLower.includes('airport')) return '✈️';
    if (typeLower.includes('park')) return '🏞️';
    return '📍';
  };

  return (
    <div className="control-panel">
      <h2>Contrôles d'Analyse</h2>
      
      <form onSubmit={handleFormSubmit} className="form-group">
        <label>Recherche de Lieu :</label>
        <div className="location-input-container">
          <div className="location-search-wrapper">
            <input
              type="text"
              placeholder="Entrez une ville, région ou point de repère..."
              value={localLocationName}
              onChange={handleLocationNameChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              ref={locationInputRef}
              className={`location-input ${locationSearchError ? 'error' : ''}`}
              disabled={isLocationSearching}
            />
            <button
              type="submit"
              className="btn search-btn"
              disabled={isLocationSearching}
            >
              {isLocationSearching ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                '🔍 Rechercher'
              )}
            </button>
          </div>
          
          {/* Location search error message */}
          {locationSearchError && (
            <div className="error-message">
              {locationSearchError}
            </div>
          )}
          
          {/* Location suggestions dropdown */}
          {showSuggestions && (
            <div className="suggestions-dropdown" ref={suggestionsListRef}>
              {!localLocationName && (
                // Show history when no search term
                <>
                  {locationHistory.length > 0 && (
                    <>
                      <div className="suggestions-header history-header">
                        <span>🕒 Lieux Récents</span>
                        <button
                          className="clear-history-btn"
                          onClick={handleClearHistory}
                          type="button"
                          disabled={isLocationSearching}
                        >
                          Tout Effacer
                        </button>
                      </div>
                      <div className="suggestions-list">
                        {locationHistory.map((historyItem, index) => (
                          <div
                            key={`hist-${historyItem.lat}-${historyItem.lon}-${index}`}
                            className={`suggestion-item history-item ${activeSuggestionIndex === index ? 'active' : ''}`}
                            onClick={() => handleHistoryItemClick(historyItem)}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                          >
                            <div className="suggestion-icon">
                              {getLocationIcon(historyItem.type)}
                            </div>
                            <div className="suggestion-main">
                              <div className="suggestion-name">{historyItem.display_name}</div>
                              <div className="suggestion-type history-type">{historyItem.type}</div>
                            </div>
                            <div className="suggestion-coordinates">
                              {historyItem.lat.toFixed(4)}, {historyItem.lon.toFixed(4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {locationHistory.length === 0 && (
                    <div className="suggestions-list">
                      <div className="suggestion-item no-results">
                        <div className="no-results-icon">📍</div>
                        <div>Aucun lieu récent</div>
                        <div className="no-results-subtext">Commencez à rechercher pour créer votre historique</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {localLocationName && (
                <div className="suggestions-list">
                  <div className="suggestion-item no-results">
                    <div className="no-results-icon">🔍</div>
                    <div>Appuyez sur Entrée ou cliquez sur Rechercher pour trouver "{localLocationName}"</div>
                    <div className="no-results-subtext">Les suggestions apparaîtront ici</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
      
      <form onSubmit={handleLocationSubmit} className="form-group">
        <label>Ou Entrez des Coordonnées :</label>
        <div className="coordinates-input-group">
          <div className="coordinate-input">
            <label>Latitude :</label>
            <input
              type="number"
              step="any"
              placeholder="ex: 40.7128"
              value={localLocation.lat}
              onChange={(e) => setLocalLocation({...localLocation, lat: e.target.value})}
            />
          </div>
          <div className="coordinate-input">
            <label>Longitude :</label>
            <input
              type="number"
              step="any"
              placeholder="ex: -74.0060"
              value={localLocation.lng}
              onChange={(e) => setLocalLocation({...localLocation, lng: e.target.value})}
            />
          </div>
        </div>
        <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>
          Définir le Lieu
        </button>
      </form>
      
      <div className="form-group">
        <label>Date Avant :</label>
        <input
          type="date"
          name="before"
          value={localDates.before}
          onChange={handleDateChange}
        />
      </div>

      <div className="form-group">
        <label>Date Après :</label>
        <input
          type="date"
          name="after"
          value={localDates.after}
          onChange={handleDateChange}
        />
      </div>

      <div className="form-group">
        <label>Filtre de Visualisation :</label>
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="rgb">RGB (Couleurs Naturelles)</option>
          <option value="false_color">Faux Couleurs (Végétation)</option>
          <option value="ndvi">NDVI (Végétation)</option>
          <option value="ndwi">NDWI (Eau)</option>
        </select>
      </div>

      <button
        type="button"
        className="btn analyze-btn"
        onClick={onAnalyze}
        disabled={isLoading}
      >
        {isLoading ? 'Analyse en cours...' : 'Analyser les Changements'}
      </button>
      
    </div>
  );
};

export default ControlPanel;