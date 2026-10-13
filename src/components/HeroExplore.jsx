import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Compass, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck, 
  Train, 
  Coffee, 
  Scale, 
  Building 
} from 'lucide-react';
import { SuburbMap } from './SuburbMap';
import { scoreSignal, bandSignal, THRESHOLDS } from '../utils/metricSignals';
import { SignalDot } from './SignalBadge';
import './HeroExplore.css';

export function HeroExplore({ 
  suburbs, 
  activeSuburb, 
  onSelectSuburb, 
  onOpenDossier, 
  onAddToCompare,
  selectedCity 
}) {
  const filteredSuburbs = selectedCity === 'all' 
    ? suburbs 
    : suburbs.filter(s => s.state === selectedCity);

  return (
    <div className="explore-view-container">
      
      {/* Hero Headline Section */}
      <section className="explore-hero-intro">
        <div className="hero-tag-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Next-Generation Spatial & Demographic Intelligence</span>
        </div>

        <h1 className="explore-hero-headline">
          Discover Australian Suburbs <br />
          <span className="gradient-highlight">Beyond Property Postcodes.</span>
        </h1>

        <p className="explore-hero-desc">
          Unpack micro-demographics, dining & vibe scores, public transit connectivity, and capital growth metrics for metropolitan pockets across Sydney, Melbourne, Brisbane, Perth, and Adelaide.
        </p>

        {/* Intelligence Stats Ticker */}
        <div className="hero-stats-ticker">
          <div className="ticker-item">
            <span className="ticker-val">23</span>
            <span className="ticker-lbl">Prime Hotspots</span>
          </div>
          <div className="ticker-sep" />
          <div className="ticker-item">
            <span className="ticker-val">6</span>
            <span className="ticker-lbl">Proprietary Vibe Indices</span>
          </div>
          <div className="ticker-sep" />
          <div className="ticker-item">
            <span className="ticker-val">ABS Census</span>
            <span className="ticker-lbl">Data Integrated</span>
          </div>
          <div className="ticker-sep" />
          <div className="ticker-item">
            <span className="ticker-val">100%</span>
            <span className="ticker-lbl">Independent Intel</span>
          </div>
        </div>
      </section>

      {/* Interactive Spatial Leaflet Map Section */}
      <section className="map-explorer-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-title">Interactive Suburb Map & Heatmap</h2>
            <p className="section-subtitle">Toggle metric overlays to visualize vibe ratings, family scores, and rental yields geographically.</p>
          </div>
        </div>

        <SuburbMap 
          suburbs={filteredSuburbs}
          activeSuburb={activeSuburb}
          onSelectSuburb={onSelectSuburb}
          onOpenDossier={onOpenDossier}
        />
      </section>

      {/* Featured Suburbs Grid Section */}
      <section className="suburbs-grid-section">
        <div className="grid-header-row">
          <div>
            <h2 className="section-title">Metropolitan Suburb Dossiers</h2>
            <p className="section-subtitle">
              Click any enclave to review census demographics, school catchments, and market economics.
            </p>
          </div>
          <div className="grid-counter">
            Showing <strong>{filteredSuburbs.length}</strong> Suburbs
          </div>
        </div>

        <div className="suburb-cards-grid">
          {filteredSuburbs.map(suburb => {
            const isSelected = activeSuburb && activeSuburb.id === suburb.id;
            return (
              <div 
                key={suburb.id} 
                className={`suburb-summary-card glass-panel ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSuburb(suburb)}
              >
                {/* Card Top Image & Badges */}
                <div className="card-media-wrapper">
                  <img src={suburb.heroImage} alt={suburb.name} className="card-thumb-img" />
                  <div className="card-badges-overlay">
                    <span className="badge badge-emerald">{suburb.badge}</span>
                    <span className="badge-dist">{suburb.distanceToCbdKm}km CBD</span>
                  </div>
                  <div className="card-score-pill">
                    <span className="pill-num">{suburb.lifestyleScores.overallScore}</span>
                    <span className="pill-txt">IQ</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-body">
                  <div className="card-header-line">
                    <div>
                      <h3 className="card-title">{suburb.name}</h3>
                      <span className="card-sub">{suburb.state} {suburb.postcode} • {suburb.lga}</span>
                    </div>
                  </div>

                  {/* Micro Score Tags */}
                  <div className="micro-scores-row">
                    <div className="m-score">
                      <span className="m-lbl">Vibe</span>
                      <span className="m-val-row">
                        <SignalDot level={scoreSignal(suburb.lifestyleScores.vibeCulture)} />
                        <span className="m-val text-purple">{suburb.lifestyleScores.vibeCulture}</span>
                      </span>
                    </div>
                    <div className="m-score">
                      <span className="m-lbl">Family</span>
                      <span className="m-val-row">
                        <SignalDot level={scoreSignal(suburb.lifestyleScores.familyLiving)} />
                        <span className="m-val text-green">{suburb.lifestyleScores.familyLiving}</span>
                      </span>
                    </div>
                    <div className="m-score">
                      <span className="m-lbl">Transit</span>
                      <span className="m-val-row">
                        <SignalDot level={scoreSignal(suburb.lifestyleScores.transitWalk)} />
                        <span className="m-val text-blue">{suburb.lifestyleScores.transitWalk}</span>
                      </span>
                    </div>
                    <div className="m-score">
                      <span className="m-lbl">Safety</span>
                      <span className="m-val-row">
                        <SignalDot level={scoreSignal(suburb.lifestyleScores.safetyCommunity)} />
                        <span className="m-val text-cyan">{suburb.lifestyleScores.safetyCommunity}</span>
                      </span>
                    </div>
                  </div>

                  {/* Property Economics */}
                  <div className="card-pricing-strip">
                    <div className="cp-col">
                      <span className="cp-lbl">House Median</span>
                      <span className="cp-val">${(suburb.propertyMetrics.medianHousePrice / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="cp-col">
                      <span className="cp-lbl">12m Growth</span>
                      <span className="cp-val m-val-row">
                        <SignalDot level={bandSignal(suburb.propertyMetrics.growth12mPercent, THRESHOLDS.growth12m.green, THRESHOLDS.growth12m.amber)} />
                        +{suburb.propertyMetrics.growth12mPercent}%
                      </span>
                    </div>
                    <div className="cp-col">
                      <span className="cp-lbl">Unit Yield</span>
                      <span className="cp-val m-val-row">
                        <SignalDot level={bandSignal(suburb.propertyMetrics.unitRentalYield, THRESHOLDS.unitYield.green, THRESHOLDS.unitYield.amber)} />
                        {suburb.propertyMetrics.unitRentalYield}%
                      </span>
                    </div>
                  </div>

                  <p className="card-blurb">{suburb.summary}</p>

                  {/* Micro-Pockets Quick Badge */}
                  {suburb.microPockets && suburb.microPockets.length > 0 && (
                    <div className="card-pockets-preview">
                      <span className="pockets-chip">
                        <MapPin size={11} className="pin-micro-icon" />
                        <span><strong>{suburb.microPockets.length} Micro-Pockets:</strong> {suburb.microPockets.map(p => p.name).join(' • ')}</span>
                      </span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="card-actions-row">
                    <button 
                      className="btn btn-primary btn-sm card-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDossier(suburb);
                      }}
                    >
                      <span>Explore Dossier</span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCompare(suburb);
                      }}
                      title="Add to Compare"
                    >
                      <Scale size={14} />
                      <span>Compare</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
