import React, { useState, useRef, useEffect } from 'react';
import { Compass, Search, MapPin, ArrowRight, SlidersHorizontal, BarChart3, Scale, Layers } from 'lucide-react';
import './Navbar.css';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  selectedCity, 
  setSelectedCity, 
  metroRegions, 
  suburbs, 
  onSelectSuburb,
  activeSuburb 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Filter suburbs by search query
  const filteredSuburbs = searchQuery.trim() === '' 
    ? [] 
    : suburbs.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.postcode.includes(searchQuery) ||
        s.lga.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.state.toLowerCase() === searchQuery.toLowerCase()
      ).slice(0, 6);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suburb) => {
    onSelectSuburb(suburb);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        
        {/* Logo and Brand */}
        <div className="brand-group" onClick={() => setActiveTab('explore')}>
          <div className="logo-icon-wrapper">
            <Compass className="logo-icon" size={24} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Suburb<span>IQ</span>
            </div>
            <div className="brand-tagline">AUSTRALIAN MICRO-INTELLIGENCE</div>
          </div>
        </div>

        {/* Global Search Bar with Autocomplete */}
        <div className="global-search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={17} />
            <input 
              type="text" 
              placeholder="Search suburb, postcode (e.g. Surry Hills, 3065, Bondi)..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && filteredSuburbs.length > 0 && (
            <div className="search-dropdown-menu">
              <div className="dropdown-label">Matching Suburbs</div>
              {filteredSuburbs.map(suburb => (
                <div 
                  key={suburb.id} 
                  className="dropdown-item"
                  onClick={() => handleSelect(suburb)}
                >
                  <div className="item-info">
                    <span className="item-name">{suburb.name}</span>
                    <span className="item-meta">{suburb.state} {suburb.postcode} • {suburb.distanceToCbdKm}km to CBD</span>
                  </div>
                  <div className="item-score">
                    <span className="pill-score">{suburb.lifestyleScores.overallScore}</span>
                    <span className="pill-tag">IQ Score</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Layers size={16} />
            <span>Map & Intel</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <Scale size={16} />
            <span>Compare Suburbs</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'matchmaker' ? 'active' : ''}`}
            onClick={() => setActiveTab('matchmaker')}
          >
            <SlidersHorizontal size={16} />
            <span>Suburb Matchmaker</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveTab('scores')}
          >
            <BarChart3 size={16} />
            <span>Scorecard Index</span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="nav-actions">
          {activeSuburb && (
            <div className="active-suburb-pill" onClick={() => setActiveTab('explore')}>
              <MapPin size={14} className="active-suburb-icon" />
              <span>{activeSuburb.name}, {activeSuburb.state}</span>
            </div>
          )}
        </div>

      </div>

      {/* Sub-header Metro Filter Bar */}
      <div className="metro-filter-bar">
        <div className="metro-filter-label">Filter Region:</div>
        <div className="metro-pills-list">
          {metroRegions.map(region => (
            <button
              key={region.id}
              className={`metro-pill ${selectedCity === region.id ? 'active' : ''}`}
              onClick={() => setSelectedCity(region.id)}
            >
              {region.label}
              <span className="count-badge">{region.count}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
