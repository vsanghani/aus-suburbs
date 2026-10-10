import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Scale, 
  ArrowUpRight 
} from 'lucide-react';
import './ScorecardIndex.css';

export function ScorecardIndex({ 
  suburbs, 
  onSelectSuburb, 
  onAddToCompare 
}) {
  const [sortField, setSortField] = useState('overallScore');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [filterText, setFilterText] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedSuburbs = useMemo(() => {
    return suburbs
      .filter(s => 
        s.name.toLowerCase().includes(filterText.toLowerCase()) ||
        s.state.toLowerCase().includes(filterText.toLowerCase()) ||
        s.postcode.includes(filterText)
      )
      .sort((a, b) => {
        let valA, valB;

        if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (sortField === 'housePrice') {
          valA = a.propertyMetrics.medianHousePrice;
          valB = b.propertyMetrics.medianHousePrice;
        } else if (sortField === 'unitPrice') {
          valA = a.propertyMetrics.medianUnitPrice;
          valB = b.propertyMetrics.medianUnitPrice;
        } else if (sortField === 'growth') {
          valA = a.propertyMetrics.growth12mPercent;
          valB = b.propertyMetrics.growth12mPercent;
        } else if (sortField === 'yield') {
          valA = a.propertyMetrics.unitRentalYield;
          valB = b.propertyMetrics.unitRentalYield;
        } else if (sortField === 'distance') {
          valA = a.distanceToCbdKm;
          valB = b.distanceToCbdKm;
        } else {
          valA = a.lifestyleScores[sortField] || a.lifestyleScores.overallScore;
          valB = b.lifestyleScores[sortField] || b.lifestyleScores.overallScore;
        }

        return sortDir === 'desc' ? valB - valA : valA - valB;
      });
  }, [suburbs, sortField, sortDir, filterText]);

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon-neutral" />;
    return sortDir === 'desc' 
      ? <ArrowDown size={12} className="sort-icon-active" /> 
      : <ArrowUp size={12} className="sort-icon-active" />;
  };

  return (
    <div className="scorecard-index-container">
      
      {/* Header */}
      <div className="index-header-row">
        <div>
          <span className="badge badge-cyan">National Benchmark</span>
          <h2 className="index-title">Australian Suburb Intelligence Index</h2>
          <p className="index-subtitle">
            Ranked master directory of Australian metropolitan pockets with live property values, rental yields, and proprietary lifestyle indices.
          </p>
        </div>

        <div className="table-search-box">
          <Search size={15} />
          <input 
            type="text" 
            placeholder="Filter list..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* League Table */}
      <div className="index-table-card glass-panel">
        <div className="table-responsive">
          <table className="score-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  <div className="th-content">
                    <span>Suburb</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th onClick={() => handleSort('distance')}>
                  <div className="th-content">
                    <span>CBD Dist</span>
                    {renderSortIcon('distance')}
                  </div>
                </th>
                <th onClick={() => handleSort('housePrice')}>
                  <div className="th-content">
                    <span>House Med</span>
                    {renderSortIcon('housePrice')}
                  </div>
                </th>
                <th onClick={() => handleSort('growth')}>
                  <div className="th-content">
                    <span>12m Growth</span>
                    {renderSortIcon('growth')}
                  </div>
                </th>
                <th onClick={() => handleSort('yield')}>
                  <div className="th-content">
                    <span>Yield</span>
                    {renderSortIcon('yield')}
                  </div>
                </th>
                <th onClick={() => handleSort('vibeCulture')}>
                  <div className="th-content">
                    <span>Vibe</span>
                    {renderSortIcon('vibeCulture')}
                  </div>
                </th>
                <th onClick={() => handleSort('familyLiving')}>
                  <div className="th-content">
                    <span>Family</span>
                    {renderSortIcon('familyLiving')}
                  </div>
                </th>
                <th onClick={() => handleSort('transitWalk')}>
                  <div className="th-content">
                    <span>Transit</span>
                    {renderSortIcon('transitWalk')}
                  </div>
                </th>
                <th onClick={() => handleSort('overallScore')}>
                  <div className="th-content">
                    <span>SuburbIQ</span>
                    {renderSortIcon('overallScore')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSuburbs.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="cell-suburb-main" onClick={() => onSelectSuburb(s)}>
                    <div className="suburb-main-info">
                      <span className="name">{s.name}</span>
                      <span className="postcode">{s.state} {s.postcode}</span>
                    </div>
                  </td>
                  <td>{s.distanceToCbdKm} km</td>
                  <td className="font-semibold">${(s.propertyMetrics.medianHousePrice / 1000000).toFixed(2)}M</td>
                  <td className="text-green font-semibold">+{s.propertyMetrics.growth12mPercent}%</td>
                  <td>{s.propertyMetrics.unitRentalYield}%</td>
                  <td>
                    <span className="score-tag purple">{s.lifestyleScores.vibeCulture}</span>
                  </td>
                  <td>
                    <span className="score-tag emerald">{s.lifestyleScores.familyLiving}</span>
                  </td>
                  <td>
                    <span className="score-tag blue">{s.lifestyleScores.transitWalk}</span>
                  </td>
                  <td>
                    <div className="score-iq-badge">
                      <span>{s.lifestyleScores.overallScore}</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button 
                        className="btn btn-primary btn-sm-tbl"
                        onClick={() => onSelectSuburb(s)}
                        title="View Dossier"
                      >
                        <ArrowUpRight size={13} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm-tbl"
                        onClick={() => onAddToCompare(s)}
                        title="Add to Compare"
                      >
                        <Scale size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
