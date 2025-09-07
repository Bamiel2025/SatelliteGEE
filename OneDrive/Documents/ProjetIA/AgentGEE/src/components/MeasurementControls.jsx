import React, { useState, useEffect } from 'react';

const MeasurementControls = ({
  measurementMode,
  onMeasurementModeChange,
  onClearMeasurements,
  onCompleteMeasurement,
  previewMeasurement,
  measurements,
  isMeasuring
}) => {
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Watch for measurement completion
  useEffect(() => {
    if (measurements.area > 0 || measurements.distance > 0) {
      setShowCompletionMessage(true);
      const timer = setTimeout(() => setShowCompletionMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [measurements.area, measurements.distance]);
  const startAreaMeasurement = () => {
    onMeasurementModeChange('area');
  };

  const startDistanceMeasurement = () => {
    onMeasurementModeChange('distance');
  };

  const clearMeasurements = () => {
    onClearMeasurements();
  };

  const completeMeasurement = () => {
    onCompleteMeasurement();
  };

  return (
    <div className="measurement-controls">
      <h3>Outils de Mesure</h3>

      {/* Message de confirmation */}
      {showCompletionMessage && (
        <div className="completion-message">
          ✅ Mesure terminée ! Les résultats ont été ajoutés à la section "Résultats".
        </div>
      )}

      <div className="measurement-buttons">
        <button
          className={`btn ${measurementMode === 'area' ? 'active' : ''}`}
          onClick={startAreaMeasurement}
          disabled={measurementMode === 'area'}
        >
          {measurementMode === 'area' ? 'Mesure Surface Active' : 'Mesurer Surface (km²)'}
        </button>

        <button
          className={`btn ${measurementMode === 'distance' ? 'active' : ''}`}
          onClick={startDistanceMeasurement}
          disabled={measurementMode === 'distance'}
          style={{ marginLeft: '0.5rem' }}
        >
          {measurementMode === 'distance' ? 'Mesure Distance Active' : 'Mesurer Distance (km)'}
        </button>
      </div>

      {measurementMode !== 'none' && (
        <div className="measurement-info">
          <div className="measurement-status">
            <p><strong>Mode:</strong> {measurementMode === 'area' ? 'Surface' : 'Distance'}</p>
            <p><strong>Points:</strong> {measurements.points || 0}</p>
          </div>

          {previewMeasurement && previewMeasurement.value > 0 && (
            <div className="preview-result">
              <p><strong>Aperçu:</strong> {previewMeasurement.value.toFixed(3)} {previewMeasurement.unit}</p>
            </div>
          )}

          <div className="measurement-actions">
            <button
              className="btn complete-btn"
              onClick={completeMeasurement}
              disabled={!previewMeasurement || previewMeasurement.value === 0}
            >
              Terminer la Mesure
            </button>

            <button
              className="btn clear-btn"
              onClick={clearMeasurements}
              style={{ marginLeft: '0.5rem' }}
            >
              Effacer
            </button>
          </div>

          <div className="measurement-instructions">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Cliquez sur la carte pour ajouter des points</li>
              <li>Double-cliquez ou cliquez "Terminer" pour finaliser</li>
              <li>Utilisez "Effacer" pour recommencer</li>
            </ul>
          </div>
        </div>
      )}

      <div className="measurement-results">
        <h4>Résultats</h4>
        <div className="result-item">
          <span>Surface:</span>
          <span className="result-value">{measurements.area.toFixed(2)} km²</span>
        </div>
        <div className="result-item">
          <span>Distance:</span>
          <span className="result-value">{measurements.distance.toFixed(2)} km</span>
        </div>
      </div>
    </div>
  );
};

export default MeasurementControls;