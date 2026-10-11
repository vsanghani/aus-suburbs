import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Volume1, 
  Car, 
  Footprints, 
  TrendingUp, 
  MapPin, 
  Users, 
  Sparkles, 
  Trees, 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  Check, 
  Info,
  Layers
} from 'lucide-react';
import './MicroPocketExplorer.css';

export function MicroPocketExplorer({ suburb }) {
  const pockets = suburb.microPockets || [];
  const [selectedPocketId, setSelectedPocketId] = useState(pockets[0]?.id || '');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePocketId, setComparePocketId] = useState(pockets[1]?.id || '');

  if (!pockets || pockets.length === 0) {
    return (
      <div className="no-pockets-state glass-panel">
        <Layers size={28} className="no-pockets-icon" />
        <h3>Street Pockets Analyzing</h3>
        <p>Micro-meshblock street analysis for {suburb.name} is currently compiling from municipal council records.</p>
      </div>
    );
  }

  const activePocket = pockets.find(p => p.id === selectedPocketId) || pockets[0];
  const secondPocket = pockets.find(p => p.id === comparePocketId) || (pockets.length > 1 ? pockets[1] : null);

  const getNoiseIcon = (level) => {
    if (level === 'Low') return <VolumeX size={15} className="text-green" />;
    if (level === 'Moderate') return <Volume1 size={15} className="text-amber" />;
    return <Volume2 size={15} className="text-rose" />;
  };

  const getNoiseBadgeClass = (level) => {
    if (level === 'Low') return 'noise-badge-low';
    if (level === 'Moderate') return 'noise-badge-mod';
    return 'noise-badge-high';
  };

  return (
    <div className="pocket-explorer-container">
      
      {/* Header Banner */}
      <div className="pocket-header-row">
        <div>
          <div className="pocket-title-tag">
            <MapPin size={13} />
            <span>HYPER-LOCAL STREET MESHBLOCKS</span>
          </div>
          <h2 className="pocket-main-title">Street-by-Street Pocket Explorer</h2>
          <p className="pocket-sub-desc">
            Suburbs are not monolithic. Discover distinct micro-enclaves within {suburb.name} — comparing street character, noise levels, parking constraints, and price disparities.
          </p>
        </div>

        {pockets.length > 1 && (
          <button 
            className={`btn btn-secondary btn-sm pocket-compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
          >
            <Scale size={15} />
            <span>{compareMode ? 'Exit Pocket Comparison' : 'Compare 2 Pockets'}</span>
          </button>
        )}
      </div>

      {/* Pocket Selection Carousel / Tabs */}
      <div className="pocket-pills-row">
        {pockets.map((pocket, idx) => {
          const isSelected = pocket.id === activePocket.id;
          return (
            <div 
              key={pocket.id}
              className={`pocket-tab-card ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedPocketId(pocket.id)}
            >
              <div className="tab-card-top">
                <span className="tab-pocket-num">Pocket #{idx + 1}</span>
                <span className={`noise-pill ${getNoiseBadgeClass(pocket.noiseLevel)}`}>
                  {pocket.noiseLevel} Noise
                </span>
              </div>
              <h4 className="tab-pocket-name">{pocket.name}</h4>
              <span className="tab-pocket-tag">{pocket.tag}</span>
              <div className="tab-card-footer">
                <span className="tab-price-delta">{pocket.priceDisparity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SINGLE POCKET DEEP DIVE MODE */}
      {!compareMode && activePocket && (
        <div className="pocket-details-card glass-panel">
          
          {/* Card Top Title Row */}
          <div className="pocket-detail-header">
            <div>
              <div className="detail-tags-row">
                <span className="badge badge-emerald">{activePocket.tag}</span>
                <span className={`noise-pill ${getNoiseBadgeClass(activePocket.noiseLevel)}`}>
                  {getNoiseIcon(activePocket.noiseLevel)}
                  <span>Noise Rating: {activePocket.noiseLevel} ({activePocket.noiseIndex}/100)</span>
                </span>
                <span className="disparity-pill">{activePocket.priceDisparity}</span>
              </div>
              <h3 className="detail-pocket-title">{activePocket.name}</h3>
            </div>

            <div className="walkscore-box">
              <span className="walk-num">{activePocket.walkScore}</span>
              <span className="walk-lbl">Walk Score</span>
            </div>
          </div>

          {/* Micro-Metrics Quad Grid */}
          <div className="pocket-metrics-grid">
            <div className="pm-cell">
              <div className="pm-lbl">
                <Volume2 size={14} className="pm-icon" />
                <span>Noise & Nightlife Activity</span>
              </div>
              <div className="pm-val">{activePocket.noiseLevel}</div>
              <div className="pm-track">
                <div 
                  className="pm-fill" 
                  style={{ 
                    width: `${activePocket.noiseIndex}%`, 
                    backgroundColor: activePocket.noiseIndex > 70 ? 'var(--accent-rose)' : (activePocket.noiseIndex > 45 ? 'var(--accent-amber)' : 'var(--accent-emerald)') 
                  }} 
                />
              </div>
              <span className="pm-sub">{activePocket.trafficProfile}</span>
            </div>

            <div className="pm-cell">
              <div className="pm-lbl">
                <Car size={14} className="pm-icon" />
                <span>Parking & Vehicle Ease</span>
              </div>
              <div className="pm-val">{activePocket.parkingEase}</div>
              <span className="pm-sub">Permit availability and street capacity</span>
            </div>

            <div className="pm-cell">
              <div className="pm-lbl">
                <TrendingUp size={14} className="pm-icon" />
                <span>Price Disparity vs Suburb Median</span>
              </div>
              <div className="pm-val text-green">{activePocket.priceDisparity}</div>
              <span className="pm-sub">Micro-pocket valuation differential</span>
            </div>

            <div className="pm-cell">
              <div className="pm-lbl">
                <Footprints size={14} className="pm-icon" />
                <span>Pedestrian Walkability</span>
              </div>
              <div className="pm-val">{activePocket.walkScore}/100</div>
              <span className="pm-sub">Immediate walking access to essentials</span>
            </div>
          </div>

          {/* Pocket Streetscape & Character */}
          <div className="pocket-narrative-section">
            <h4 className="narrative-heading">Streetscape Character & Housing Architecture</h4>
            <p className="narrative-text">{activePocket.character}</p>
          </div>

          {/* Key Streets Directory */}
          <div className="key-streets-section">
            <h4 className="streets-heading">Notable Streets & Enclaves in This Pocket:</h4>
            <div className="street-tags-cloud">
              {activePocket.keyStreets.map((street, idx) => (
                <div key={idx} className="street-chip">
                  <MapPin size={13} className="chip-icon" />
                  <span>{street}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resident Profile & Scores Quartet */}
          <div className="pocket-bottom-split">
            <div className="persona-box">
              <div className="persona-hdr">
                <Users size={16} />
                <span>Dominant Resident Persona</span>
              </div>
              <p className="persona-txt">{activePocket.residentPersona}</p>
            </div>

            <div className="micro-scores-quad">
              <div className="m-score-item">
                <span className="ms-num text-purple">{activePocket.microScores.vibe}</span>
                <span className="ms-lbl">Vibe Score</span>
              </div>
              <div className="m-score-item">
                <span className="ms-num text-green">{activePocket.microScores.quiet}</span>
                <span className="ms-lbl">Tranquility</span>
              </div>
              <div className="m-score-item">
                <span className="ms-num text-blue">{activePocket.microScores.convenience}</span>
                <span className="ms-lbl">Convenience</span>
              </div>
              <div className="m-score-item">
                <span className="ms-num text-cyan">{activePocket.microScores.family}</span>
                <span className="ms-lbl">Family Fit</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* HEAD-TO-HEAD POCKET SHOWDOWN MODE */}
      {compareMode && secondPocket && (
        <div className="pocket-showdown-grid">
          
          {/* Left Pocket */}
          <div className="showdown-card glass-panel">
            <div className="showdown-hdr">
              <span className="badge badge-emerald">{activePocket.tag}</span>
              <h3 className="showdown-title">{activePocket.name}</h3>
            </div>

            <div className="showdown-stat-rows">
              <div className="stat-row">
                <span className="s-lbl">Noise Rating</span>
                <span className={`noise-pill ${getNoiseBadgeClass(activePocket.noiseLevel)}`}>
                  {activePocket.noiseLevel} ({activePocket.noiseIndex}/100)
                </span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Walk Score</span>
                <span className="s-val">{activePocket.walkScore}/100</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Parking Ease</span>
                <span className="s-val">{activePocket.parkingEase}</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Price Disparity</span>
                <span className="s-val text-green">{activePocket.priceDisparity}</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Vibe Index</span>
                <span className="s-val text-purple">{activePocket.microScores.vibe}/100</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Tranquility Index</span>
                <span className="s-val text-green">{activePocket.microScores.quiet}/100</span>
              </div>
            </div>

            <p className="showdown-desc">{activePocket.character}</p>
            
            <div className="showdown-streets">
              <strong>Key Streets:</strong> {activePocket.keyStreets.join(', ')}
            </div>
          </div>

          {/* Versus Divider */}
          <div className="showdown-vs-badge">
            <span>VS</span>
          </div>

          {/* Right Pocket */}
          <div className="showdown-card glass-panel">
            <div className="showdown-selector-bar">
              <select 
                value={comparePocketId} 
                onChange={(e) => setComparePocketId(e.target.value)}
                className="second-pocket-select"
              >
                {pockets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.tag})</option>
                ))}
              </select>
            </div>

            <div className="showdown-hdr">
              <span className="badge badge-cyan">{secondPocket.tag}</span>
              <h3 className="showdown-title">{secondPocket.name}</h3>
            </div>

            <div className="showdown-stat-rows">
              <div className="stat-row">
                <span className="s-lbl">Noise Rating</span>
                <span className={`noise-pill ${getNoiseBadgeClass(secondPocket.noiseLevel)}`}>
                  {secondPocket.noiseLevel} ({secondPocket.noiseIndex}/100)
                </span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Walk Score</span>
                <span className="s-val">{secondPocket.walkScore}/100</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Parking Ease</span>
                <span className="s-val">{secondPocket.parkingEase}</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Price Disparity</span>
                <span className="s-val text-green">{secondPocket.priceDisparity}</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Vibe Index</span>
                <span className="s-val text-purple">{secondPocket.microScores.vibe}/100</span>
              </div>
              <div className="stat-row">
                <span className="s-lbl">Tranquility Index</span>
                <span className="s-val text-green">{secondPocket.microScores.quiet}/100</span>
              </div>
            </div>

            <p className="showdown-desc">{secondPocket.character}</p>
            
            <div className="showdown-streets">
              <strong>Key Streets:</strong> {secondPocket.keyStreets.join(', ')}
            </div>
          </div>

        </div>
      )}

      {/* Intelligence Note */}
      <div className="pocket-intel-footnote">
        <Info size={16} className="fn-icon" />
        <span>
          <strong>Microburb Methodology:</strong> Micro-pocket boundaries are synthesized from ABS Meshblock population density, NSW/VIC local planning zonings, and OpenStreetMap acoustic buffer maps.
        </span>
      </div>

    </div>
  );
}
