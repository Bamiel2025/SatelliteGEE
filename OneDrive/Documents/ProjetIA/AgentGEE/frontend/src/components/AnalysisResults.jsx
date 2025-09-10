import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateAnalysisReport, getEventAnalysisParams } from '../services/analysisService';

const AnalysisResults = ({ measurements, filter, locationName, location, dates }) => {
  // Simplified analysis results without event-specific details
  const getDefaultDescription = () => {
    return {
      title: 'Résultats d\'Analyse',
      description: 'Comparaison d\'images satellites et analyse de détection des changements.',
      metrics: [
        'Surface mesurée : ' + measurements.area.toFixed(2) + ' km²',
        'Distance mesurée : ' + measurements.distance.toFixed(2) + ' km'
      ]
    };
  };

  // Use default analysis parameters
  const analysisParams = getEventAnalysisParams('default');
  const analysisReport = generateAnalysisReport(measurements, 'default');

  // Legend for NDVI/NDWI with descriptive labels
  const renderLegend = () => {
    if (filter !== 'ndvi' && filter !== 'ndwi') return null;

    const title = filter === 'ndvi' ? 'Légende NDVI (Végétation)' : 'Légende NDWI (Eau)';
    const from = -1;
    const to = 1;
    const step = 0.25;
    const palette = filter === 'ndvi' ? ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'] : ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43'];

    // Descriptive labels for ranges
    const getDescription = (i, filter) => {
      if (filter === 'ndvi') {
        if (i < -0.5) return 'Sol nu / Eau';
        if (i < 0) return 'Végétation très faible';
        if (i < 0.5) return 'Végétation modérée';
        return 'Végétation dense';
      } else {
        if (i < -0.5) return 'Terre sèche';
        if (i < 0) return 'Faible présence d\'eau';
        if (i < 0.5) return 'Eau modérée';
        return 'Eau abondante';
      }
    };

    const labels = [];
    for (let i = from; i < to; i += step) {
      const next = Math.min(i + step, to);
      const gradient = palette[Math.floor((i + 1) * 4)];
      const desc = getDescription(i, filter);
      labels.push(
        <div key={i} style={{ margin: '4px 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: `linear-gradient(to right, ${gradient}, ${palette[Math.floor((next + 1) * 4)] || gradient})`,
            width: '80px', height: '15px', border: '1px solid #999', opacity: 0.8, marginRight: '8px'
          }}></div>
          <div style={{ fontSize: '10px', color: '#666', flex: 1 }}>
            <div>{i.toFixed(2)} - {next.toFixed(2)}</div>
            <div style={{ fontWeight: 'bold', color: '#333', fontSize: '9px' }}>{desc}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="legend-section" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '12px',
        lineHeight: '16px'
      }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          {title}
        </div>
        <div style={{ fontSize: '10px' }}>
          {labels}
        </div>
      </div>
    );
  };

  // Export function
  const exportToPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for side-by-side maps
    const pageWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    const margin = 14;

    // Title
    doc.setFontSize(20);
    doc.text('Rapport d\'Analyse d\'Images Satellites', margin, 20);

    // Location and dates
    doc.setFontSize(12);
    doc.text(`Lieu: ${locationName} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`, margin, 30);
    doc.text(`Dates: Avant - ${dates.before}, Après - ${dates.after}`, margin, 38);
    doc.text(`Filtre: ${filter.toUpperCase()}`, margin, 46);

    // Measurements
    doc.setFontSize(12);
    doc.text('Mesures:', margin, 60);
    doc.text(`Surface: ${measurements.area.toFixed(2)} km²`, margin, 68);
    doc.text(`Distance: ${measurements.distance.toFixed(2)} km`, margin, 76);

    // Legend if applicable
    if (filter === 'ndvi' || filter === 'ndwi') {
      doc.setFontSize(12);
      doc.text('Légende:', margin, 90);
      // Add legend text (simplified)
      const legendText = filter === 'ndvi' ? 'NDVI: Rouge (faible végétation) à Vert (dense)' : 'NDWI: Bleu (eau) à Rouge (terre)';
      doc.text(legendText, margin, 98);
    }

    // Capture split map and add to PDF
    const mapElement = document.querySelector('.split-map-container');
    if (mapElement) {
      const canvas = await html2canvas(mapElement, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      let imgWidth = pageWidth - 2 * margin; // Available width: 269mm
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If height exceeds available height, scale to fit height
      const availableHeight = pageHeight - 2 * margin; // 182mm
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }
      
      // Center horizontally and vertically
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      doc.addPage();
      doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    }

    doc.save('rapport_analyse_satellites.pdf');
  };

  return (
    <div className="analysis-results">
      <h2>{analysisReport.title}</h2>
      <p>{getDefaultDescription().description}</p>

      {/* Section spéciale pour les mesures */}
      {(measurements.area > 0 || measurements.distance > 0) && (
        <div className="measurement-results-highlight">
          <h3>📏 Mesures Réalisées</h3>
          <div className="measurement-cards">
            {measurements.area > 0 && (
              <div className="measurement-card area-card">
                <div className="measurement-icon">📐</div>
                <div className="measurement-content">
                  <div className="measurement-label">Surface Mesurée</div>
                  <div className="measurement-value">{measurements.area.toFixed(2)} km²</div>
                </div>
              </div>
            )}
            {measurements.distance > 0 && (
              <div className="measurement-card distance-card">
                <div className="measurement-icon">📏</div>
                <div className="measurement-content">
                  <div className="measurement-label">Distance Mesurée</div>
                  <div className="measurement-value">{measurements.distance.toFixed(2)} km</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="metrics">
        <h3>Métriques Clés :</h3>
        <ul>
          {getDefaultDescription().metrics.map((metric, index) => (
            <li key={index}>{metric}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-params">
        <h3>Paramètres d'Analyse :</h3>
        <p><strong>Indice :</strong> {analysisParams.index}</p>
        <p><strong>Seuil :</strong> {analysisParams.threshold}</p>
        <p><strong>Description :</strong> {analysisParams.description}</p>
      </div>

      {renderLegend()}

      <div className="export-options">
        <button className="btn" onClick={exportToPDF}>Exporter le Rapport (PDF)</button>
        <button className="btn" style={{ marginTop: '0.5rem' }}>Sauvegarder l'Analyse</button>
      </div>
    </div>
  );
};

export default AnalysisResults;