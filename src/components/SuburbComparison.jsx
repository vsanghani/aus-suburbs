import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Trophy, 
  TrendingUp, 
  Home, 
  Building, 
  DollarSign, 
  Check, 
  MapPin, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SCORE_METRICS_INFO } from '../data/suburbsData';
import './SuburbComparison.css';

export function SuburbComparison({ 
  suburbs, 
  compareList, 
  onAddToCompare, 
  onRemoveFromCompare, 
  onOpenDossier 
}) {
  const [selectedToAdd, setSelectedToAdd] = useState('');

  // Available suburbs not yet in compare list
  const availableSuburbs = suburbs.filter(s => !compareList.some(c => c.id === s.id));

  const handleAdd = (e) => {
    const id = e.target.value;
    if (!id) return;
    const item = suburbs.find(s => s.id === id);
    if (item && compareList.length < 3) {
      onAddToCompare(item);
      setSelectedToAdd('');
    }
  };

  const formatCur = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Helper to determine highest value in compare list
  const getWinner = (extractor, higherIsBetter = true) => {
    if (compareList.length < 2) return null;
    let bestVal = higherIsBetter ? -Infinity : Infinity;
    let bestId = null;

    compareList.forEach(s => {
      const val = extractor(s);
      if (higherIsBetter ? val > bestVal : val < bestVal) {
        bestVal = val;
        bestId = s.id;
      }
    });

    return bestId;
  };

  return (
    <div className="compare-container">
      
      {/* Compare Header */}
      <div className="compare-header-row">
        <div>
          <span className="badge badge-indigo">Side-by-Side Analytics</span>
          <h2 className="compare-title">Australian Suburb Showdown</h2>
          <p className="compare-subtitle">
            Compare micro-demographics, rental yields, family suitability, and capital growth metrics head-to-head.
          </p>
        </div>

        {compareList.length < 3 && availableSuburbs.length > 0 && (
          <div className="add-suburb-dropdown-group">
            <select 
              value={selectedToAdd} 
              onChange={handleAdd} 
              className="add-suburb-select"
            >
              <option value="">+ Add Suburb to Compare...</option>
              {availableSuburbs.map(s => (
                <option key={s.id} value={s.id}>{s.name}, {s.state} ({s.postcode})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {compareList.length === 0 ? (
        <div className="empty-compare-state glass-panel">
          <p>No suburbs selected for comparison yet.</p>
          <div className="quick-suggest-row">
            <span>Quick Compare Presets:</span>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const s1 = suburbs.find(s => s.id === 'surry-hills-nsw');
                const s2 = suburbs.find(s => s.id === 'fitzroy-vic');
                const s3 = suburbs.find(s => s.id === 'new-farm-qld');
                if (s1 && s2 && s3) {
                  onAddToCompare(s1);
                  onAddToCompare(s2);
                  onAddToCompare(s3);
                }
              }}
            >
              Surry Hills (NSW) vs Fitzroy (VIC) vs New Farm (QLD)
            </button>
          </div>
        </div>
      ) : (
        <div className="comparison-table-wrapper glass-panel">
          
          {/* Suburb Profile Cards Header Row */}
          <div className="comparison-cards-row">
            <div className="metric-label-column sticky-header">
              <span className="lbl-faded">Metrics & Dimensions</span>
            </div>

            {compareList.map(s => (
              <div key={s.id} className="suburb-compare-card">
                <button 
                  className="remove-compare-btn"
                  onClick={() => onRemoveFromCompare(s.id)}
                  title="Remove"
                >
                  <X size={15} />
                </button>

                <div className="suburb-card-inner">
                  <span className="badge badge-emerald">{s.badge}</span>
                  <h3 className="card-suburb-name">{s.name}</h3>
                  <span className="card-suburb-state">{s.state} {s.postcode} • {s.distanceToCbdKm}km to CBD</span>

                  <div className="card-iq-score-pill">
                    <span className="iq-num">{s.lifestyleScores.overallScore}</span>
                    <span className="iq-txt">IQ Score</span>
                  </div>

                  <button 
                    className="btn btn-ghost btn-sm view-dossier-link"
                    onClick={() => onOpenDossier(s)}
                  >
                    <span>Full Dossier</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Section 1: Property Economics */}
          <div className="compare-section-header">
            <span>PROPERTY MARKET & YIELDS</span>
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Median House Price</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.propertyMetrics.medianHousePrice, false) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">{formatCur(s.propertyMetrics.medianHousePrice)}</span>
                  {isWinner && <span className="winner-tag">More Affordable</span>}
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Median Unit Price</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.propertyMetrics.medianUnitPrice, false) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">{formatCur(s.propertyMetrics.medianUnitPrice)}</span>
                  {isWinner && <span className="winner-tag">More Affordable</span>}
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">12m Capital Growth</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.propertyMetrics.growth12mPercent, true) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value text-green">+{s.propertyMetrics.growth12mPercent}%</span>
                  {isWinner && <span className="winner-tag"><Trophy size={11} /> Highest Growth</span>}
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Unit Rental Yield</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.propertyMetrics.unitRentalYield, true) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">{s.propertyMetrics.unitRentalYield}%</span>
                  {isWinner && <span className="winner-tag"><Trophy size={11} /> Top Yield</span>}
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Days on Market</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.propertyMetrics.daysOnMarket, false) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">{s.propertyMetrics.daysOnMarket} days</span>
                  {isWinner && <span className="winner-tag">Fastest Moving</span>}
                </div>
              );
            })}
          </div>

          {/* Section 2: Lifestyle Scores */}
          <div className="compare-section-header">
            <span>LIFESTYLE & LIVEABILITY INDICES</span>
          </div>

          {Object.entries(SCORE_METRICS_INFO).map(([key, info]) => {
            const winnerId = getWinner(s => s.lifestyleScores[key] || 0, true);
            return (
              <div key={key} className="compare-row">
                <div className="metric-label-column">
                  <span className="score-lbl-text">{info.label}</span>
                </div>
                {compareList.map(s => {
                  const score = s.lifestyleScores[key] || 0;
                  const isWinner = winnerId === s.id;
                  return (
                    <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                      <div className="cell-score-bar-group">
                        <span className="cell-score-num" style={{ color: info.color }}>{score}</span>
                        <div className="mini-bar-track">
                          <div 
                            className="mini-bar-fill" 
                            style={{ width: `${score}%`, backgroundColor: info.color }}
                          />
                        </div>
                      </div>
                      {isWinner && <span className="winner-tag"><Trophy size={11} /> Category Leader</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Section 3: Micro-Demographics */}
          <div className="compare-section-header">
            <span>MICRO-DEMOGRAPHICS & CENSUS PROFILE</span>
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Weekly Household Income</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.demographics.weeklyHouseholdIncome, true) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">${s.demographics.weeklyHouseholdIncome}/wk</span>
                  {isWinner && <span className="winner-tag">Highest Earning</span>}
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Median Age</div>
            {compareList.map(s => (
              <div key={s.id} className="compare-data-cell">
                <span className="cell-value">{s.demographics.medianAge} yrs</span>
              </div>
            ))}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Tertiary Educated %</div>
            {compareList.map(s => {
              const isWinner = getWinner(sub => sub.demographics.educationHigherEdPercent, true) === s.id;
              return (
                <div key={s.id} className={`compare-data-cell ${isWinner ? 'cell-highlight' : ''}`}>
                  <span className="cell-value">{s.demographics.educationHigherEdPercent}%</span>
                </div>
              );
            })}
          </div>

          <div className="compare-row">
            <div className="metric-label-column">Renter Ratio</div>
            {compareList.map(s => (
              <div key={s.id} className="compare-data-cell">
                <span className="cell-value">{s.demographics.housingTenure.renting}% renters</span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
