import React from 'react';

const MeasurementTools = ({ measurements, previewMeasurement, measurementMode, onMeasurementModeChange, onNewMeasurement, onClearMeasurements, onCompleteMeasurement }) => {

  const startAreaMeasurement = () => {
    onMeasurementModeChange('area');
  };

  const startDistanceMeasurement = () => {
    onMeasurementModeChange('distance');
  };

  const cancelMeasurement = () => {
    onMeasurementModeChange('none');
  };

  const newMeasurement = () => {
    if (onNewMeasurement && measurementMode !== 'none') {
      onNewMeasurement(measurementMode);
    }
  };

  const clearMeasurements = () => {
    if (onClearMeasurements) {
      onClearMeasurements();
    }
  };


  return (
    <div className="measurement-tools">
      <h2>Outils de Mesure</h2>
      
      <div className="tool-buttons">
        <button
          className={`btn ${measurementMode === 'area' ? 'active' : ''}`}
          onClick={startAreaMeasurement}
          disabled={measurementMode === 'area'}
        >
          {measurementMode === 'area' ? 'Mesure de surface active' : 'Mesurer la Surface (km²)'}
        </button>

        <button
          className={`btn ${measurementMode === 'distance' ? 'active' : ''}`}
          onClick={startDistanceMeasurement}
          disabled={measurementMode === 'distance'}
          style={{ marginTop: '0.5rem' }}
        >
          {measurementMode === 'distance' ? 'Mesure de distance active' : 'Mesurer la Distance (km)'}
        </button>

        {measurementMode !== 'none' && (
          <>
            <button
              className="btn cancel-btn"
              onClick={cancelMeasurement}
              style={{ marginTop: '0.5rem' }}
            >
              Annuler la Mesure
            </button>
            <button
              className="btn clear-btn"
              onClick={clearMeasurements}
              style={{ marginTop: '0.5rem' }}
            >
              Effacer Toutes les Mesures
            </button>
          </>
        )}
      </div>
      
      <div className="measurement-display">
        <h3>Mesures</h3>
        <div className="measurement-item">
          <span>Surface :</span>
          <span className="measurement-value">{measurements.area.toFixed(2)} km²</span>
        </div>
        <div className="measurement-item">
          <span>Distance :</span>
          <span className="measurement-value">{measurements.distance.toFixed(2)} km</span>
        </div>
        {measurementMode !== 'none' && (
          <>
            <div className="measurement-instructions">
              <p className="measurement-instruction">
                <strong>Instructions :</strong> Cliquez sur la carte pour ajouter des points.
                <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Double-cliquez sur la carte OU cliquez sur "Terminer" pour calculer la mesure finale.</span>
              </p>
              <button
                className="btn complete-btn"
                onClick={onCompleteMeasurement}
                style={{ marginTop: '0.5rem', backgroundColor: '#28a745', color: 'white' }}
                disabled={previewMeasurement.value === 0 || measurements[measurementMode] > 0}
              >
                Terminer la Mesure
              </button>
            </div>
            {previewMeasurement.value > 0 && (
              <div className="preview-measurement" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <p className="measurement-preview" style={{ margin: 0, fontSize: '0.95em' }}>
                  <strong>Aperçu en temps réel :</strong> {previewMeasurement.value.toFixed(3)} {previewMeasurement.unit}
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}> (mesure actuelle)</span>
                </p>
              </div>
            )}
            <p className="measurement-status">
              Mode : {measurementMode === 'area' ? 'Surface' : 'Distance'} |
              Points ajoutés : {measurements.points || 0}
            </p>
            <button
              className="btn new-measurement-btn"
              onClick={newMeasurement}
              style={{ marginTop: '0.5rem' }}
            >
              Nouvelle Mesure
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MeasurementTools;