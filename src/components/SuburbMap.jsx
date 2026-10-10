import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, 
  Sparkles, 
  Users, 
  Train, 
  DollarSign, 
  Percent, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck,
  Trees
} from 'lucide-react';
import './SuburbMap.css';

const METRIC_MODES = [
  { id: 'overallScore', label: 'Overall IQ', category: 'scores', icon: Sparkles, format: (v) => `${v}` },
  { id: 'vibeCulture', label: 'Vibe & Culture', category: 'scores', icon: Sparkles, format: (v) => `${v}` },
  { id: 'familyLiving', label: 'Family Living', category: 'scores', icon: Users, format: (v) => `${v}` },
  { id: 'transitWalk', label: 'Transit & Walk', category: 'scores', icon: Train, format: (v) => `${v}` },
  { id: 'medianHousePrice', label: 'House Price', category: 'property', icon: DollarSign, format: (v) => `$${(v / 1000000).toFixed(1)}M` },
  { id: 'unitRentalYield', label: 'Unit Yield', category: 'property', icon: Percent, format: (v) => `${v}%` }
];

export function SuburbMap({ 
  suburbs, 
  activeSuburb, 
  onSelectSuburb, 
  onOpenDossier 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [activeMetric, setActiveMetric] = useState('overallScore');

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent multiple initializations

    // Center of Eastern & Southern Australia default
    const map = L.map(mapContainerRef.current, {
      center: [-33.8688, 151.2093], // Default Sydney
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Add high-end CartoDB Dark Matter / Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when suburbs or activeMetric or activeSuburb changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    suburbs.forEach(suburb => {
      let metricValue;
      let displayValue;
      let colorClass = 'badge-blue';

      if (activeMetric === 'medianHousePrice') {
        metricValue = suburb.propertyMetrics.medianHousePrice;
        displayValue = `$${(metricValue / 1000000).toFixed(1)}M`;
        colorClass = metricValue > 2500000 ? 'badge-amber' : 'badge-emerald';
      } else if (activeMetric === 'unitRentalYield') {
        metricValue = suburb.propertyMetrics.unitRentalYield;
        displayValue = `${metricValue}%`;
        colorClass = metricValue >= 5.0 ? 'badge-emerald' : 'badge-cyan';
      } else {
        metricValue = suburb.lifestyleScores[activeMetric] || suburb.lifestyleScores.overallScore;
        displayValue = `${metricValue}`;
        colorClass = metricValue >= 90 ? 'badge-emerald' : (metricValue >= 80 ? 'badge-cyan' : 'badge-purple');
      }

      const isSelected = activeSuburb && activeSuburb.id === suburb.id;

      // Custom HTML Pin Marker
      const iconHtml = `
        <div class="custom-map-pin ${isSelected ? 'selected-pin' : ''} ${colorClass}">
          <div class="pin-metric">${displayValue}</div>
          <div class="pin-title">${suburb.name}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [80, 44],
        iconAnchor: [40, 44]
      });

      const marker = L.marker([suburb.lat, suburb.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectSuburb(suburb);
      });

      markersLayerRef.current.addLayer(marker);
    });

  }, [suburbs, activeMetric, activeSuburb, onSelectSuburb]);

  // Center map on activeSuburb when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !activeSuburb) return;
    mapInstanceRef.current.flyTo([activeSuburb.lat, activeSuburb.lng], 13, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [activeSuburb]);

  return (
    <div className="suburb-map-wrapper">
      
      {/* Metric Overlay Controls */}
      <div className="map-controls-panel">
        <div className="controls-header">
          <Layers size={15} />
          <span>Heatmap Dimension</span>
        </div>
        <div className="metric-buttons-grid">
          {METRIC_MODES.map(mode => {
            const Icon = mode.icon;
            const isActive = activeMetric === mode.id;
            return (
              <button
                key={mode.id}
                className={`metric-toggle-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveMetric(mode.id)}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actual Map Canvas */}
      <div ref={mapContainerRef} className="map-canvas-container" />

      {/* Floating Selected Suburb Quick Peek Card */}
      {activeSuburb && (
        <div className="suburb-floating-peek glass-panel">
          <div className="peek-header">
            <div>
              <div className="peek-tag-row">
                <span className="badge badge-emerald">{activeSuburb.badge}</span>
                <span className="peek-distance">{activeSuburb.distanceToCbdKm}km to CBD</span>
              </div>
              <h3 className="peek-title">{activeSuburb.name}, {activeSuburb.state}</h3>
            </div>
            <div className="peek-score-circle">
              <span className="score-num">{activeSuburb.lifestyleScores.overallScore}</span>
              <span className="score-lbl">IQ</span>
            </div>
          </div>

          <div className="peek-metrics-row">
            <div className="peek-metric-col">
              <span className="metric-lbl">Median House</span>
              <span className="metric-val">${(activeSuburb.propertyMetrics.medianHousePrice / 1000000).toFixed(2)}M</span>
            </div>
            <div className="peek-metric-col">
              <span className="metric-lbl">Median Unit</span>
              <span className="metric-val">${(activeSuburb.propertyMetrics.medianUnitPrice / 1000).toFixed(0)}k</span>
            </div>
            <div className="peek-metric-col">
              <span className="metric-lbl">12m Capital Growth</span>
              <span className="metric-val text-green">+{activeSuburb.propertyMetrics.growth12mPercent}%</span>
            </div>
            <div className="peek-metric-col">
              <span className="metric-lbl">Unit Yield</span>
              <span className="metric-val">{activeSuburb.propertyMetrics.unitRentalYield}%</span>
            </div>
          </div>

          <p className="peek-summary">{activeSuburb.summary}</p>

          <div className="peek-actions">
            <button 
              className="btn btn-primary peek-cta-btn"
              onClick={() => onOpenDossier(activeSuburb)}
            >
              <span>Explore Micro-Demographic Dossier</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="map-legend-box glass-panel">
        <div className="legend-label">Metric Intensity</div>
        <div className="legend-gradient-bar"></div>
        <div className="legend-labels-row">
          <span>Moderate</span>
          <span>High</span>
          <span>Elite (Top 5%)</span>
        </div>
      </div>

    </div>
  );
}
