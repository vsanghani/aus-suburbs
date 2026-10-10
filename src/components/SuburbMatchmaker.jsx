import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  Home, 
  Building, 
  MapPin, 
  ArrowUpRight, 
  Check, 
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import './SuburbMatchmaker.css';

export function SuburbMatchmaker({ 
  suburbs, 
  onSelectSuburb, 
  onAddToCompare 
}) {
  const [propertyType, setPropertyType] = useState('house'); // 'house' | 'unit'
  const [maxBudget, setMaxBudget] = useState(3000000);
  const [minVibe, setMinVibe] = useState(60);
  const [minFamily, setMinFamily] = useState(60);
  const [maxCbdDist, setMaxCbdDist] = useState(25);
  const [minYield, setMinYield] = useState(3.0);

  // Compute matches and score
  const matchedSuburbs = useMemo(() => {
    return suburbs.map(suburb => {
      const price = propertyType === 'house' 
        ? suburb.propertyMetrics.medianHousePrice 
        : suburb.propertyMetrics.medianUnitPrice;

      const yieldVal = propertyType === 'house'
        ? suburb.propertyMetrics.houseRentalYield
        : suburb.propertyMetrics.unitRentalYield;

      // Match scoring algorithm
      let matchScore = 100;
      let reasons = [];

      // Budget check
      if (price <= maxBudget) {
        reasons.push(`Within budget ($${(price / 1000000).toFixed(2)}M)`);
      } else {
        matchScore -= Math.min(35, ((price - maxBudget) / maxBudget) * 40);
      }

      // Distance check
      if (suburb.distanceToCbdKm <= maxCbdDist) {
        reasons.push(`${suburb.distanceToCbdKm}km from CBD`);
      } else {
        matchScore -= 15;
      }

      // Vibe check
      if (suburb.lifestyleScores.vibeCulture >= minVibe) {
        reasons.push(`High Vibe Score (${suburb.lifestyleScores.vibeCulture}/100)`);
      } else {
        matchScore -= 12;
      }

      // Family check
      if (suburb.lifestyleScores.familyLiving >= minFamily) {
        reasons.push(`Strong Family Rating (${suburb.lifestyleScores.familyLiving}/100)`);
      } else {
        matchScore -= 12;
      }

      // Yield check
      if (yieldVal >= minYield) {
        reasons.push(`Healthy ${yieldVal}% rental yield`);
      } else {
        matchScore -= 10;
      }

      matchScore = Math.max(10, Math.min(99, Math.round(matchScore)));

      return {
        ...suburb,
        matchScore,
        reasons,
        price,
        yieldVal
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [suburbs, propertyType, maxBudget, minVibe, minFamily, maxCbdDist, minYield]);

  return (
    <div className="matchmaker-container">
      
      {/* Header */}
      <div className="matchmaker-header">
        <span className="badge badge-emerald">Smart Recommendation Engine</span>
        <h2 className="matchmaker-title">Suburb Matchmaker</h2>
        <p className="matchmaker-subtitle">
          Configure your personal lifestyle and investment criteria. Our algorithm scans micro-demographics and property fundamentals to identify your ideal Australian enclave.
        </p>
      </div>

      <div className="matchmaker-layout-grid">
        
        {/* Left Filter Sidebar */}
        <div className="filter-sidebar glass-panel">
          <div className="filter-panel-title">
            <SlidersHorizontal size={16} />
            <span>Target Criteria</span>
          </div>

          {/* Property Type Toggle */}
          <div className="filter-group">
            <label className="filter-lbl">Target Property Type</label>
            <div className="prop-type-toggle">
              <button 
                className={`type-btn ${propertyType === 'house' ? 'active' : ''}`}
                onClick={() => setPropertyType('house')}
              >
                <Home size={14} />
                <span>Houses</span>
              </button>
              <button 
                className={`type-btn ${propertyType === 'unit' ? 'active' : ''}`}
                onClick={() => setPropertyType('unit')}
              >
                <Building size={14} />
                <span>Apartments / Units</span>
              </button>
            </div>
          </div>

          {/* Max Budget Slider */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-lbl">Maximum Budget</label>
              <span className="slider-val">${(maxBudget / 1000000).toFixed(1)}M</span>
            </div>
            <input 
              type="range" 
              min="500000" 
              max="4500000" 
              step="100000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Min Vibe Score Slider */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-lbl">Min Vibe & Culture Score</label>
              <span className="slider-val">{minVibe}+</span>
            </div>
            <input 
              type="range" 
              min="40" 
              max="95" 
              step="5"
              value={minVibe}
              onChange={(e) => setMinVibe(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Min Family Score Slider */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-lbl">Min Family Suitability</label>
              <span className="slider-val">{minFamily}+</span>
            </div>
            <input 
              type="range" 
              min="40" 
              max="95" 
              step="5"
              value={minFamily}
              onChange={(e) => setMinFamily(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Max Distance to CBD */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-lbl">Max Distance to CBD</label>
              <span className="slider-val">{maxCbdDist} km</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="30" 
              step="2"
              value={maxCbdDist}
              onChange={(e) => setMaxCbdDist(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Min Rental Yield */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-lbl">Min Rental Yield</label>
              <span className="slider-val">{minYield}%</span>
            </div>
            <input 
              type="range" 
              min="2.5" 
              max="6.0" 
              step="0.2"
              value={minYield}
              onChange={(e) => setMinYield(Number(e.target.value))}
              className="range-slider"
            />
          </div>

          <button 
            className="btn btn-secondary reset-filters-btn"
            onClick={() => {
              setMaxBudget(3000000);
              setMinVibe(60);
              setMinFamily(60);
              setMaxCbdDist(25);
              setMinYield(3.0);
            }}
          >
            Reset Criteria
          </button>
        </div>

        {/* Right Matches List */}
        <div className="matches-results-column">
          <div className="matches-counter-bar">
            <span>Showing <strong>{matchedSuburbs.length}</strong> Suburbs Ranked by Match Affinity</span>
          </div>

          <div className="matches-grid">
            {matchedSuburbs.map((suburb, index) => (
              <div key={suburb.id} className="match-card glass-panel">
                
                <div className="match-card-header">
                  <div>
                    <div className="match-tags-row">
                      <span className="match-rank-badge">#{index + 1} Best Fit</span>
                      <span className="badge badge-cyan">{suburb.state} {suburb.postcode}</span>
                      <span className="dist-text">{suburb.distanceToCbdKm}km to CBD</span>
                    </div>
                    <h3 className="match-suburb-name">{suburb.name}</h3>
                  </div>

                  <div className="match-score-pill">
                    <span className="match-score-val">{suburb.matchScore}%</span>
                    <span className="match-score-lbl">Match</span>
                  </div>
                </div>

                <div className="match-pricing-row">
                  <div className="price-item">
                    <span className="p-lbl">Median {propertyType === 'house' ? 'House' : 'Unit'}</span>
                    <span className="p-val">${(suburb.price / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="price-item">
                    <span className="p-lbl">Rental Yield</span>
                    <span className="p-val">{suburb.yieldVal}%</span>
                  </div>
                  <div className="price-item">
                    <span className="p-lbl">Overall IQ</span>
                    <span className="p-val text-green">{suburb.lifestyleScores.overallScore}/100</span>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="match-reasons-box">
                  <span className="reasons-hdr">Why it matches your profile:</span>
                  <div className="reasons-pills">
                    {suburb.reasons.slice(0, 3).map((r, i) => (
                      <span key={i} className="reason-chip">
                        <Check size={12} className="check-icon" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="match-card-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectSuburb(suburb)}
                  >
                    <span>Inspect Dossier</span>
                    <ArrowUpRight size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAddToCompare(suburb)}
                  >
                    <span>+ Compare</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
