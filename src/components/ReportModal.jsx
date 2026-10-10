import React from 'react';
import { X, Printer, Compass, CheckCircle2, MapPin, Building, Home, Users } from 'lucide-react';
import { SCORE_METRICS_INFO } from '../data/suburbsData';
import './ReportModal.css';

export function ReportModal({ suburb, onClose }) {
  if (!suburb) return null;

  const handlePrint = () => {
    window.print();
  };

  const { propertyMetrics, lifestyleScores, demographics, amenities, pocketHighlights } = suburb;

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-dialog">
        
        {/* Controls Bar */}
        <div className="report-controls-bar no-print">
          <div className="report-ctrl-title">Executive Suburb Intelligence Brief</div>
          <div className="report-ctrl-btns">
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button className="close-report-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="printable-report-sheet">
          
          {/* Header */}
          <div className="report-sheet-header">
            <div className="report-brand">
              <Compass className="report-brand-icon" size={24} />
              <div>
                <div className="report-brand-name">Suburb<span>IQ</span></div>
                <div className="report-brand-sub">Australian Property & Micro-Demographic Intelligence</div>
              </div>
            </div>

            <div className="report-doc-meta">
              <div className="meta-item"><strong>Date:</strong> {new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })}</div>
              <div className="meta-item"><strong>Document:</strong> SUBURB-BRIEF-{suburb.postcode}</div>
              <div className="meta-item"><strong>Classification:</strong> Market Intelligence</div>
            </div>
          </div>

          {/* Suburb Title Strip */}
          <div className="report-suburb-banner">
            <div>
              <span className="report-state-tag">{suburb.state} • {suburb.lga}</span>
              <h1 className="report-suburb-name">{suburb.name} ({suburb.postcode})</h1>
              <p className="report-suburb-tagline">{suburb.badge} • {suburb.distanceToCbdKm} km to Central Business District</p>
            </div>

            <div className="report-iq-box">
              <div className="iq-big-num">{lifestyleScores.overallScore}</div>
              <div className="iq-big-lbl">SuburbIQ Score</div>
            </div>
          </div>

          {/* Executive Overview */}
          <div className="report-section">
            <h2 className="section-title">Executive Profile & Character</h2>
            <p className="section-p">{suburb.summary}</p>
          </div>

          {/* Property Market Fundamentals */}
          <div className="report-section">
            <h2 className="section-title">Property Market Fundamentals</h2>
            <div className="report-table-grid">
              <div className="rt-cell">
                <span className="rt-lbl">Median House Price</span>
                <span className="rt-val">${(propertyMetrics.medianHousePrice / 1000000).toFixed(2)}M</span>
              </div>
              <div className="rt-cell">
                <span className="rt-lbl">Median Unit Price</span>
                <span className="rt-val">${(propertyMetrics.medianUnitPrice / 1000).toFixed(0)}k</span>
              </div>
              <div className="rt-cell">
                <span className="rt-lbl">12m Capital Growth</span>
                <span className="rt-val text-green">+{propertyMetrics.growth12mPercent}%</span>
              </div>
              <div className="rt-cell">
                <span className="rt-lbl">Unit Rental Yield</span>
                <span className="rt-val">{propertyMetrics.unitRentalYield}%</span>
              </div>
              <div className="rt-cell">
                <span className="rt-lbl">House Weekly Rent</span>
                <span className="rt-val">${propertyMetrics.medianWeeklyRentHouse}/wk</span>
              </div>
              <div className="rt-cell">
                <span className="rt-lbl">Days on Market</span>
                <span className="rt-val">{propertyMetrics.daysOnMarket} days</span>
              </div>
            </div>
          </div>

          {/* Lifestyle Indices Table */}
          <div className="report-section">
            <h2 className="section-title">Proprietary Liveability & Lifestyle Indices</h2>
            <div className="report-scores-matrix">
              {Object.entries(SCORE_METRICS_INFO).map(([k, info]) => (
                <div key={k} className="report-score-box">
                  <div className="score-hdr">
                    <span className="score-nm">{info.label}</span>
                    <span className="score-vl">{lifestyleScores[k] || 0}/100</span>
                  </div>
                  <div className="score-bar-bg">
                    <div className="score-bar-fl" style={{ width: `${lifestyleScores[k] || 0}%`, backgroundColor: info.color }} />
                  </div>
                  <span className="score-sub">{info.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Census Demographics */}
          <div className="report-section">
            <h2 className="section-title">Micro-Demographic Profile</h2>
            <div className="report-demo-summary">
              <div><strong>Weekly Household Income:</strong> ${demographics.weeklyHouseholdIncome}/wk (State Avg: ${demographics.stateAvgWeeklyIncome})</div>
              <div><strong>Population:</strong> {demographics.population.toLocaleString()} | <strong>Median Age:</strong> {demographics.medianAge} years</div>
              <div><strong>Tertiary Education:</strong> {demographics.educationHigherEdPercent}% | <strong>Professionals Ratio:</strong> {demographics.employedProfessionalsPercent}%</div>
              <div><strong>Housing Tenure:</strong> {demographics.housingTenure.renting}% Renting, {demographics.housingTenure.mortgage}% Mortgage, {demographics.housingTenure.ownedOutright}% Outright</div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="report-footer">
            <p>Generated by SuburbIQ Intelligence Engine. Data sources include ABS Census, ACARA School Directory, and Metropolitan Transport GTFS feeds. For informational and research purposes only.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
