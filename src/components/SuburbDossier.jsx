import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Printer, 
  Scale, 
  MapPin, 
  TrendingUp, 
  Building, 
  Home, 
  DollarSign, 
  Percent, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Coffee, 
  Trees, 
  ShieldCheck, 
  Train, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Sparkles
} from 'lucide-react';
import { SCORE_METRICS_INFO } from '../data/suburbsData';
import './SuburbDossier.css';

export function SuburbDossier({ 
  suburb, 
  onClose, 
  onAddToCompare, 
  onOpenReport 
}) {
  const [activeTab, setActiveTab] = useState('lifestyle');

  if (!suburb) return null;

  const { propertyMetrics, lifestyleScores, demographics, amenities, pocketHighlights } = suburb;

  // Format currency
  const formatCur = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="dossier-overlay-container">
      <div className="dossier-modal glass-panel">
        
        {/* Top Header Controls */}
        <div className="dossier-top-bar">
          <div className="suburb-meta-breadcrumbs">
            <span>Australia</span>
            <span className="sep">/</span>
            <span>{suburb.state}</span>
            <span className="sep">/</span>
            <span>{suburb.lga}</span>
            <span className="sep">/</span>
            <span className="current">{suburb.name} {suburb.postcode}</span>
          </div>

          <div className="dossier-action-buttons">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onAddToCompare(suburb)}
              title="Add to Suburb Comparison"
            >
              <Scale size={15} />
              <span>Compare</span>
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenReport(suburb)}
              title="Generate Printable Executive Briefing"
            >
              <Printer size={15} />
              <span>Report</span>
            </button>
            <button 
              className="close-dossier-btn" 
              onClick={onClose}
              title="Close Dossier"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="dossier-hero">
          <div className="hero-content">
            <div className="hero-badge-row">
              <span className="badge badge-emerald">{suburb.badge}</span>
              <span className="hero-distance-tag">
                <MapPin size={13} />
                {suburb.distanceToCbdKm} km from {suburb.state} Capital CBD
              </span>
            </div>

            <h1 className="hero-title">{suburb.name}</h1>
            <p className="hero-subtitle">{suburb.summary}</p>
          </div>

          <div className="hero-score-card">
            <div className="score-badge-ring">
              <span className="score-number">{lifestyleScores.overallScore}</span>
              <span className="score-max">/ 100</span>
            </div>
            <div className="score-label-col">
              <span className="score-header-txt">SuburbIQ Index</span>
              <span className="score-rank-tag">Top 4% Nationwide</span>
            </div>
          </div>
        </div>

        {/* Key Market Indicators Strip */}
        <div className="market-metrics-strip">
          <div className="metric-box">
            <div className="metric-box-hdr">
              <Home size={15} className="metric-icon" />
              <span>Median House</span>
            </div>
            <div className="metric-box-val">{formatCur(propertyMetrics.medianHousePrice)}</div>
            <div className="metric-box-sub text-green">
              <TrendingUp size={12} />
              <span>+{propertyMetrics.growth12mPercent}% (12m)</span>
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-box-hdr">
              <Building size={15} className="metric-icon" />
              <span>Median Unit</span>
            </div>
            <div className="metric-box-val">{formatCur(propertyMetrics.medianUnitPrice)}</div>
            <div className="metric-box-sub">
              <span>Yield: <strong>{propertyMetrics.unitRentalYield}%</strong></span>
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-box-hdr">
              <DollarSign size={15} className="metric-icon" />
              <span>Median Rent</span>
            </div>
            <div className="metric-box-val">${propertyMetrics.medianWeeklyRentUnit}/wk</div>
            <div className="metric-box-sub">
              <span>House: ${propertyMetrics.medianWeeklyRentHouse}/wk</span>
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-box-hdr">
              <Clock size={15} className="metric-icon" />
              <span>Days On Market</span>
            </div>
            <div className="metric-box-val">{propertyMetrics.daysOnMarket} days</div>
            <div className="metric-box-sub">
              <span>Clearance: <strong>{propertyMetrics.clearanceRatePercent}%</strong></span>
            </div>
          </div>
        </div>

        {/* Dossier Tabs Navigation */}
        <div className="dossier-tabs-nav">
          <button 
            className={`dossier-tab-btn ${activeTab === 'lifestyle' ? 'active' : ''}`}
            onClick={() => setActiveTab('lifestyle')}
          >
            <Sparkles size={16} />
            <span>Lifestyle Scores</span>
          </button>
          <button 
            className={`dossier-tab-btn ${activeTab === 'demographics' ? 'active' : ''}`}
            onClick={() => setActiveTab('demographics')}
          >
            <Users size={16} />
            <span>Micro-Demographics</span>
          </button>
          <button 
            className={`dossier-tab-btn ${activeTab === 'amenities' ? 'active' : ''}`}
            onClick={() => setActiveTab('amenities')}
          >
            <Train size={16} />
            <span>Schools & Infrastructure</span>
          </button>
          <button 
            className={`dossier-tab-btn ${activeTab === 'pocket' ? 'active' : ''}`}
            onClick={() => setActiveTab('pocket')}
          >
            <CheckCircle2 size={16} />
            <span>Pocket Character & Insights</span>
          </button>
        </div>

        {/* Dossier Tab Content */}
        <div className="dossier-tab-body">

          {/* TAB 1: LIFESTYLE SCORES */}
          {activeTab === 'lifestyle' && (
            <div className="tab-pane lifestyle-pane">
              <div className="lifestyle-grid">
                {Object.entries(SCORE_METRICS_INFO).map(([key, info]) => {
                  const score = lifestyleScores[key] || 0;
                  return (
                    <div key={key} className="score-card-item">
                      <div className="score-card-top">
                        <div className="score-title-group">
                          <span className="score-name">{info.label}</span>
                          <span className="score-desc">{info.description}</span>
                        </div>
                        <div className="score-gauge-number" style={{ color: info.color }}>
                          {score}
                        </div>
                      </div>

                      <div className="score-progress-bar-bg">
                        <div 
                          className="score-progress-fill" 
                          style={{ 
                            width: `${score}%`, 
                            backgroundColor: info.color,
                            boxShadow: `0 0 10px ${info.color}66`
                          }}
                        />
                      </div>

                      <div className="score-card-footer">
                        <span className="state-benchmark">
                          {score >= 80 ? 'Well above state benchmark' : (score >= 65 ? 'Above state average' : 'Moderate performance')}
                        </span>
                        <span className="rank-indicator">
                          {score >= 90 ? 'Top Tier' : (score >= 75 ? 'Strong' : 'Average')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proprietary Intelligence Note */}
              <div className="intel-callout-box">
                <Info size={18} className="callout-icon" />
                <div className="callout-text">
                  <strong>How SuburbIQ calculates these metrics:</strong> We synthesize real-time ABS Census tables, ACARA school performance, state transport GTFS timetables, municipal crime registers, and Point-of-Interest geodata into normalized percentile scores.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MICRO-DEMOGRAPHICS */}
          {activeTab === 'demographics' && (
            <div className="tab-pane demographics-pane">
              
              <div className="demo-overview-grid">
                {/* Household Income Comparison */}
                <div className="demo-card">
                  <h3 className="card-heading">Median Weekly Household Income</h3>
                  <div className="income-display">
                    <span className="income-val">${demographics.weeklyHouseholdIncome}</span>
                    <span className="income-lbl">per week</span>
                  </div>
                  <div className="income-comparison-bar">
                    <div className="bar-label-row">
                      <span>{suburb.name}: ${demographics.weeklyHouseholdIncome}/wk</span>
                      <span>State Avg: ${demographics.stateAvgWeeklyIncome}/wk</span>
                    </div>
                    <div className="progress-dual">
                      <div 
                        className="progress-suburb" 
                        style={{ width: `${Math.min(100, (demographics.weeklyHouseholdIncome / 3500) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="income-delta-badge">
                    +{Math.round(((demographics.weeklyHouseholdIncome - demographics.stateAvgWeeklyIncome) / demographics.stateAvgWeeklyIncome) * 100)}% higher than {suburb.state} state average
                  </div>
                </div>

                {/* Population & Demographics Key Stats */}
                <div className="demo-card">
                  <h3 className="card-heading">Key Population Stats</h3>
                  <div className="key-stat-row">
                    <div className="k-stat">
                      <span className="k-val">{demographics.population.toLocaleString()}</span>
                      <span className="k-lbl">Total Population</span>
                    </div>
                    <div className="k-stat">
                      <span className="k-val">{demographics.medianAge} yrs</span>
                      <span className="k-lbl">Median Age</span>
                    </div>
                    <div className="k-stat">
                      <span className="k-val">{demographics.educationHigherEdPercent}%</span>
                      <span className="k-lbl">Tertiary Educated</span>
                    </div>
                    <div className="k-stat">
                      <span className="k-val">{demographics.employedProfessionalsPercent}%</span>
                      <span className="k-lbl">Professionals / Execs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Household Structure & Housing Tenure */}
              <div className="demo-breakdown-grid">
                {/* Household Composition */}
                <div className="demo-card">
                  <h3 className="card-heading">Household Composition</h3>
                  <div className="chart-bar-list">
                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Couples without children</span>
                        <span>{demographics.householdType.couplesNoKids}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.householdType.couplesNoKids}%` }} className="bar-fill purple" /></div>
                    </div>

                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Single person living</span>
                        <span>{demographics.householdType.singleLiving}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.householdType.singleLiving}%` }} className="bar-fill blue" /></div>
                    </div>

                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Families with children</span>
                        <span>{demographics.householdType.familiesWithKids}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.householdType.familiesWithKids}%` }} className="bar-fill emerald" /></div>
                    </div>
                  </div>
                </div>

                {/* Housing Tenure */}
                <div className="demo-card">
                  <h3 className="card-heading">Housing Tenure Mix</h3>
                  <div className="chart-bar-list">
                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Renting</span>
                        <span>{demographics.housingTenure.renting}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.housingTenure.renting}%` }} className="bar-fill cyan" /></div>
                    </div>

                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Purchasing with Mortgage</span>
                        <span>{demographics.housingTenure.mortgage}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.housingTenure.mortgage}%` }} className="bar-fill amber" /></div>
                    </div>

                    <div className="chart-item">
                      <div className="chart-item-hdr">
                        <span>Owned Outright</span>
                        <span>{demographics.housingTenure.ownedOutright}%</span>
                      </div>
                      <div className="chart-item-bar"><div style={{ width: `${demographics.housingTenure.ownedOutright}%` }} className="bar-fill emerald" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cultural Diversity & Ancestries */}
              <div className="demo-card ancestries-card">
                <h3 className="card-heading">Top Reported Cultural Ancestries</h3>
                <div className="ancestry-tags-list">
                  {demographics.topAncestries.map((anc, idx) => (
                    <span key={idx} className="ancestry-tag">
                      #{idx + 1} {anc}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SCHOOLS & AMENITIES */}
          {activeTab === 'amenities' && (
            <div className="tab-pane amenities-pane">
              
              <div className="amenities-split-grid">
                {/* Schools Catchment */}
                <div className="amenities-card">
                  <div className="amenities-hdr">
                    <GraduationCap size={18} className="amenity-icon" />
                    <h3>Top Rated Schools & Catchments</h3>
                  </div>
                  <div className="schools-table">
                    {amenities.topSchools.map((school, idx) => (
                      <div key={idx} className="school-row">
                        <div className="school-info">
                          <span className="school-name">{school.name}</span>
                          <span className="school-type">{school.type} • {school.distance}</span>
                        </div>
                        <div className="school-icsea">
                          <span className="icsea-val">{school.icsea}</span>
                          <span className="icsea-lbl">ICSEA Rating</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transit & Commute */}
                <div className="amenities-card">
                  <div className="amenities-hdr">
                    <Train size={18} className="amenity-icon" />
                    <h3>Public Transit Corridors</h3>
                  </div>
                  <div className="transit-list">
                    {amenities.transitHubs.map((hub, idx) => (
                      <div key={idx} className="transit-item">
                        <CheckCircle2 size={16} className="item-icon" />
                        <span>{hub}</span>
                      </div>
                    ))}
                  </div>

                  <div className="parks-section">
                    <div className="amenities-hdr" style={{ marginTop: '20px' }}>
                      <Trees size={18} className="amenity-icon" />
                      <h3>Parks & Green Canopy</h3>
                    </div>
                    <div className="transit-list">
                      {amenities.parksAndRecreation.map((park, idx) => (
                        <div key={idx} className="transit-item">
                          <CheckCircle2 size={16} className="item-icon" />
                          <span>{park}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coffee & Dining Density */}
              <div className="amenities-card coffee-card">
                <div className="amenities-hdr">
                  <Coffee size={18} className="amenity-icon" />
                  <h3>Gastronomy & Cafe Density</h3>
                </div>
                <div className="coffee-stats-row">
                  <div className="c-stat">
                    <span className="c-val">{amenities.coffeeAndDining.cafesPerSqKm}</span>
                    <span className="c-lbl">Cafes & Eateries per km²</span>
                  </div>
                  <div className="c-notables">
                    <span className="c-lbl">Local Benchmark Venues:</span>
                    <div className="notable-pills">
                      {amenities.coffeeAndDining.notableSpots.map((spot, idx) => (
                        <span key={idx} className="spot-pill">{spot}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: POCKET CHARACTER & INSIGHTS */}
          {activeTab === 'pocket' && (
            <div className="tab-pane pocket-pane">
              
              <div className="pros-cons-grid">
                {/* Pros */}
                <div className="pocket-box pros-box">
                  <div className="box-title text-green">
                    <CheckCircle2 size={18} />
                    <h3>Key Strengths & Growth Drivers</h3>
                  </div>
                  <ul className="bullet-list">
                    {pocketHighlights.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="pocket-box cons-box">
                  <div className="box-title text-rose">
                    <AlertCircle size={18} />
                    <h3>Points of Consideration</h3>
                  </div>
                  <ul className="bullet-list">
                    {pocketHighlights.cons.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Buyer / Resident Profile */}
              <div className="profile-ideal-card">
                <div className="ideal-title">
                  <Users size={18} />
                  <h3>Ideal Demographic Fit</h3>
                </div>
                <div className="ideal-tags-list">
                  {pocketHighlights.idealFor.map((item, idx) => (
                    <span key={idx} className="ideal-tag">{item}</span>
                  ))}
                </div>
              </div>

              {/* Infrastructure Hotspot */}
              <div className="infrastructure-callout">
                <Building size={18} className="infra-icon" />
                <div>
                  <h4>Infrastructure & Planning Pipeline:</h4>
                  <p>{pocketHighlights.developmentHotspots}</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
