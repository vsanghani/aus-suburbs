import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroExplore } from './components/HeroExplore';
import { SuburbDossier } from './components/SuburbDossier';
import { SuburbComparison } from './components/SuburbComparison';
import { SuburbMatchmaker } from './components/SuburbMatchmaker';
import { ScorecardIndex } from './components/ScorecardIndex';
import { ReportModal } from './components/ReportModal';
import { AUSTRALIAN_SUBURBS, METRO_REGIONS } from './data/suburbsData';
import { Compass, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'compare' | 'matchmaker' | 'scores'
  const [selectedCity, setSelectedCity] = useState('all');
  const [activeSuburb, setActiveSuburb] = useState(AUSTRALIAN_SUBURBS[0]);
  const [dossierSuburb, setDossierSuburb] = useState(null);
  const [reportSuburb, setReportSuburb] = useState(null);

  // Pre-seed compare list with 3 iconic Australian suburbs across NSW, VIC, QLD
  const [compareList, setCompareList] = useState([
    AUSTRALIAN_SUBURBS[0], // Surry Hills NSW
    AUSTRALIAN_SUBURBS[5], // Fitzroy VIC
    AUSTRALIAN_SUBURBS[8]  // New Farm QLD
  ]);

  const handleSelectSuburb = (suburb) => {
    setActiveSuburb(suburb);
  };

  const handleOpenDossier = (suburb) => {
    setActiveSuburb(suburb);
    setDossierSuburb(suburb);
  };

  const handleCloseDossier = () => {
    setDossierSuburb(null);
  };

  const handleAddToCompare = (suburb) => {
    if (!compareList.some(s => s.id === suburb.id)) {
      if (compareList.length >= 3) {
        // Replace the last one
        setCompareList([...compareList.slice(0, 2), suburb]);
      } else {
        setCompareList([...compareList, suburb]);
      }
    }
    setActiveTab('compare');
  };

  const handleRemoveFromCompare = (suburbId) => {
    setCompareList(compareList.filter(s => s.id !== suburbId));
  };

  const handleOpenReport = (suburb) => {
    setReportSuburb(suburb);
  };

  const handleCloseReport = () => {
    setReportSuburb(null);
  };

  return (
    <div className="app-container">
      
      {/* Global Navigation Bar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        metroRegions={METRO_REGIONS}
        suburbs={AUSTRALIAN_SUBURBS}
        onSelectSuburb={(suburb) => {
          handleSelectSuburb(suburb);
          handleOpenDossier(suburb);
        }}
        activeSuburb={activeSuburb}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: Explore & Spatial Map */}
        {activeTab === 'explore' && (
          <HeroExplore 
            suburbs={AUSTRALIAN_SUBURBS}
            activeSuburb={activeSuburb}
            onSelectSuburb={handleSelectSuburb}
            onOpenDossier={handleOpenDossier}
            onAddToCompare={handleAddToCompare}
            selectedCity={selectedCity}
          />
        )}

        {/* TAB 2: Suburb Comparison Showdown */}
        {activeTab === 'compare' && (
          <SuburbComparison 
            suburbs={AUSTRALIAN_SUBURBS}
            compareList={compareList}
            onAddToCompare={handleAddToCompare}
            onRemoveFromCompare={handleRemoveFromCompare}
            onOpenDossier={handleOpenDossier}
          />
        )}

        {/* TAB 3: Suburb Matchmaker & Quiz */}
        {activeTab === 'matchmaker' && (
          <SuburbMatchmaker 
            suburbs={AUSTRALIAN_SUBURBS}
            onSelectSuburb={handleOpenDossier}
            onAddToCompare={handleAddToCompare}
          />
        )}

        {/* TAB 4: League Table / Scorecard Index */}
        {activeTab === 'scores' && (
          <ScorecardIndex 
            suburbs={AUSTRALIAN_SUBURBS}
            onSelectSuburb={handleOpenDossier}
            onAddToCompare={handleAddToCompare}
          />
        )}

      </main>

      {/* Micro-Demographic Deep Dive Dossier Modal */}
      {dossierSuburb && (
        <SuburbDossier 
          suburb={dossierSuburb}
          onClose={handleCloseDossier}
          onAddToCompare={handleAddToCompare}
          onOpenReport={handleOpenReport}
        />
      )}

      {/* Printable Executive Report Modal */}
      {reportSuburb && (
        <ReportModal 
          suburb={reportSuburb}
          onClose={handleCloseReport}
        />
      )}

      {/* Global Platform Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <Compass className="footer-compass" size={22} />
              <span>Suburb<span>IQ</span></span>
            </div>
            <p className="footer-bio">
              The next-generation Australian micro-demographic and property intelligence platform. Empowering home buyers, investors, and urban researchers with hyper-local insight.
            </p>
            <div className="footer-copy">
              © {new Date().getFullYear()} SuburbIQ Australia. All Rights Reserved.
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Intelligence Tools</h4>
            <ul>
              <li onClick={() => setActiveTab('explore')}>Interactive Spatial Map</li>
              <li onClick={() => setActiveTab('compare')}>3-Way Suburb Comparison</li>
              <li onClick={() => setActiveTab('matchmaker')}>Matchmaker Finder</li>
              <li onClick={() => setActiveTab('scores')}>National Liveability League</li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Metropolitan Regions</h4>
            <ul>
              <li onClick={() => { setSelectedCity('NSW'); setActiveTab('explore'); }}>Sydney & NSW Suburbs</li>
              <li onClick={() => { setSelectedCity('VIC'); setActiveTab('explore'); }}>Melbourne & VIC Suburbs</li>
              <li onClick={() => { setSelectedCity('QLD'); setActiveTab('explore'); }}>Brisbane & QLD Suburbs</li>
              <li onClick={() => { setSelectedCity('WA'); setActiveTab('explore'); }}>Perth & WA Suburbs</li>
              <li onClick={() => { setSelectedCity('SA'); setActiveTab('explore'); }}>Adelaide & SA Suburbs</li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Data Governance</h4>
            <p className="footer-data-notes">
              Census data derived from Australian Bureau of Statistics (ABS) 2021/2026 TableBuilder. School ICSEA ratings from ACARA. Transport frequencies synthesized from open GTFS transit feeds.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
