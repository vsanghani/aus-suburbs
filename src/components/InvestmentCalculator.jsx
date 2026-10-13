import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Home, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  FileText, 
  Scale, 
  ChevronRight, 
  RefreshCw, 
  ArrowUpRight,
  Printer,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { 
  calculateStampDuty, 
  estimateLmi, 
  calculateMortgageRepayment, 
  calculateTenYearProjection,
  STATE_NAMES
} from '../utils/propertyFinance';
import './InvestmentCalculator.css';

export function InvestmentCalculator({
  suburbs,
  activeSuburb,
  onSelectSuburb,
  onOpenDossier,
  onAddToCompare
}) {
  // Current suburb state
  const [selectedSuburbId, setSelectedSuburbId] = useState(
    activeSuburb ? activeSuburb.id : (suburbs[0] ? suburbs[0].id : '')
  );
  const currentSuburb = useMemo(() => {
    return suburbs.find(s => s.id === selectedSuburbId) || suburbs[0];
  }, [suburbs, selectedSuburbId]);

  // Active view tab inside calculator: 'stamp-duty' | 'cashflow' | 'projection'
  const [activeView, setActiveView] = useState('stamp-duty');

  // Property configuration
  const [propertyType, setPropertyType] = useState('house'); // 'house' | 'unit'
  const [customPrice, setCustomPrice] = useState(null);
  const [customWeeklyRent, setCustomWeeklyRent] = useState(null);

  // Derived baseline purchase price and rent
  const purchasePrice = useMemo(() => {
    if (customPrice !== null) return customPrice;
    if (!currentSuburb) return 1200000;
    return propertyType === 'house' 
      ? currentSuburb.propertyMetrics.medianHousePrice 
      : currentSuburb.propertyMetrics.medianUnitPrice;
  }, [currentSuburb, propertyType, customPrice]);

  const weeklyRent = useMemo(() => {
    if (customWeeklyRent !== null) return customWeeklyRent;
    if (!currentSuburb) return 750;
    return propertyType === 'house'
      ? currentSuburb.propertyMetrics.medianWeeklyRentHouse
      : currentSuburb.propertyMetrics.medianWeeklyRentUnit;
  }, [currentSuburb, propertyType, customWeeklyRent]);

  // Buyer configuration
  const [buyerType, setBuyerType] = useState('investor'); // 'investor' | 'owner_occupier' | 'first_home'
  const [stateOverride, setStateOverride] = useState(null);
  const effectiveState = stateOverride || (currentSuburb ? currentSuburb.state : 'NSW');
  const [isForeignBuyer, setIsForeignBuyer] = useState(false);

  // Deposit & Loan settings
  const [depositPercent, setDepositPercent] = useState(20);
  const [capitalizeLmi, setCapitalizeLmi] = useState(false);
  const [interestRate, setInterestRate] = useState(5.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [repaymentType, setRepaymentType] = useState('pi'); // 'pi' | 'io'
  const [repaymentFrequency, setRepaymentFrequency] = useState('monthly'); // 'monthly' | 'fortnightly' | 'weekly'

  // Holding Outgoings & Expenses (Annual)
  const [managementFeeRate, setManagementFeeRate] = useState(6.0); // % of gross rent
  const [vacancyWeeks, setVacancyWeeks] = useState(2);
  const [councilRatesAnnual, setCouncilRatesAnnual] = useState(1850);
  const [waterRatesAnnual, setWaterRatesAnnual] = useState(1150);
  const [strataAnnual, setStrataAnnual] = useState(propertyType === 'unit' ? 4400 : 0);
  const [insuranceAnnual, setInsuranceAnnual] = useState(1650);
  const [repairsAnnual, setRepairsAnnual] = useState(1500);

  // Negative Gearing & Tax
  const [marginalTaxRate, setMarginalTaxRate] = useState(37); // %, options: 0, 16, 30, 37, 45 (+ 2% medicare)
  const [annualDepreciation, setAnnualDepreciation] = useState(4500); // Div 40 & 43

  // Capital Growth settings
  const defaultGrowth = currentSuburb ? currentSuburb.propertyMetrics.growth12mPercent : 6.0;
  const [capitalGrowthRate, setCapitalGrowthRate] = useState(defaultGrowth);
  const [hoveredYear, setHoveredYear] = useState(null);

  // Sync state & default values when suburb changes
  const handleSuburbChange = (suburbId) => {
    setSelectedSuburbId(suburbId);
    setCustomPrice(null);
    setCustomWeeklyRent(null);
    setStateOverride(null);
    const sub = suburbs.find(s => s.id === suburbId);
    if (sub) {
      setCapitalGrowthRate(sub.propertyMetrics.growth12mPercent);
      if (onSelectSuburb) onSelectSuburb(sub);
    }
  };

  useEffect(() => {
    if (activeSuburb && activeSuburb.id !== selectedSuburbId) {
      handleSuburbChange(activeSuburb.id);
    }
    // Sync when the parent suburb changes (e.g. opened from a dossier).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSuburb?.id]);

  const handlePropertyTypeToggle = (type) => {
    setPropertyType(type);
    setCustomPrice(null);
    setCustomWeeklyRent(null);
    setStrataAnnual(type === 'unit' ? 4400 : 0);
  };

  const handleResetToMedian = () => {
    setCustomPrice(null);
    setCustomWeeklyRent(null);
    setStrataAnnual(propertyType === 'unit' ? 4400 : 0);
  };

  // 1. Calculations: Stamp Duty & Upfront Costs
  const stampDutyResult = useMemo(() => {
    return calculateStampDuty(purchasePrice, effectiveState, buyerType, isForeignBuyer);
  }, [purchasePrice, effectiveState, buyerType, isForeignBuyer]);

  const depositAmount = useMemo(() => {
    return Math.round(purchasePrice * (depositPercent / 100));
  }, [purchasePrice, depositPercent]);

  const baseLoanAmount = Math.max(0, purchasePrice - depositAmount);

  const lmiAmount = useMemo(() => {
    return estimateLmi(baseLoanAmount, purchasePrice);
  }, [baseLoanAmount, purchasePrice]);

  const totalLoanAmount = capitalizeLmi ? (baseLoanAmount + lmiAmount) : baseLoanAmount;

  // Fixed regulatory & legal fee benchmarks
  const govTransferFees = useMemo(() => {
    // NSW/VIC/QLD registration of mortgage + transfer fee sliding bracket
    return effectiveState === 'VIC' ? 1450 : effectiveState === 'NSW' ? 420 : 380;
  }, [effectiveState]);
  const legalFees = 1850;
  const inspectionFees = 650;

  const totalUpfrontCash = useMemo(() => {
    const lmiCash = capitalizeLmi ? 0 : lmiAmount;
    return depositAmount + stampDutyResult.dutyPayable + govTransferFees + legalFees + inspectionFees + lmiCash;
  }, [depositAmount, stampDutyResult.dutyPayable, govTransferFees, legalFees, inspectionFees, lmiAmount, capitalizeLmi]);

  // 2. Calculations: Mortgage Repayments
  const mortgageResult = useMemo(() => {
    return calculateMortgageRepayment({
      loanAmount: totalLoanAmount,
      interestRateAnnual: interestRate,
      loanTermYears,
      repaymentType
    });
  }, [totalLoanAmount, interestRate, loanTermYears, repaymentType]);

  const activeRepaymentDisplay = useMemo(() => {
    if (repaymentFrequency === 'weekly') return mortgageResult.weekly;
    if (repaymentFrequency === 'fortnightly') return mortgageResult.fortnightly;
    return mortgageResult.monthly;
  }, [repaymentFrequency, mortgageResult]);

  // 3. Calculations: Rental Income & Outgoings
  const occupiedWeeks = Math.max(0, 52 - vacancyWeeks);
  const annualGrossRent = weeklyRent * occupiedWeeks;
  const grossYield = purchasePrice > 0 ? ((annualGrossRent / purchasePrice) * 100) : 0;

  const annualManagementFee = Math.round(annualGrossRent * (managementFeeRate / 100));
  const totalAnnualOutgoings = useMemo(() => {
    return (
      annualManagementFee +
      Number(councilRatesAnnual) +
      Number(waterRatesAnnual) +
      Number(strataAnnual) +
      Number(insuranceAnnual) +
      Number(repairsAnnual)
    );
  }, [annualManagementFee, councilRatesAnnual, waterRatesAnnual, strataAnnual, insuranceAnnual, repairsAnnual]);

  const netRentalIncome = annualGrossRent - totalAnnualOutgoings;
  const netYield = purchasePrice > 0 ? ((netRentalIncome / purchasePrice) * 100) : 0;

  // 4. Calculations: Cash Flow & Negative Gearing
  const preTaxAnnualCashFlow = netRentalIncome - mortgageResult.annual;
  const preTaxWeeklyCashFlow = Math.round(preTaxAnnualCashFlow / 52);

  // Tax deductions: deductible interest + deductible outgoings + building depreciation
  // First year deductible interest approximation
  const annualDeductibleInterest = Math.round(totalLoanAmount * (interestRate / 100));
  const totalTaxDeductions = annualDeductibleInterest + totalAnnualOutgoings + Number(annualDepreciation);
  const taxableIncomeOrLoss = annualGrossRent - totalTaxDeductions; // If negative, loss available for deduction
  
  const effectiveMarginalTaxRate = marginalTaxRate > 0 ? (marginalTaxRate + 2) : 0; // add 2% medicare levy
  const annualTaxBenefit = taxableIncomeOrLoss < 0 
    ? Math.round(Math.abs(taxableIncomeOrLoss) * (effectiveMarginalTaxRate / 100))
    : Math.round(- (taxableIncomeOrLoss * (effectiveMarginalTaxRate / 100)));

  const afterTaxAnnualCashFlow = preTaxAnnualCashFlow + annualTaxBenefit;
  const afterTaxWeeklyCashFlow = Math.round(afterTaxAnnualCashFlow / 52);

  // 5. Calculations: 10-Year Projection
  const projectionData = useMemo(() => {
    return calculateTenYearProjection({
      purchasePrice,
      initialLoan: totalLoanAmount,
      interestRateAnnual: interestRate,
      capitalGrowthRateAnnual: capitalGrowthRate,
      loanTermYears,
      repaymentType
    });
  }, [purchasePrice, totalLoanAmount, interestRate, capitalGrowthRate, loanTermYears, repaymentType]);

  // Format currencies
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    return `$${Math.round(val).toLocaleString()}`;
  };

  const formatMillions = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${Math.round(val).toLocaleString()}`;
  };

  // Helper SVG scaling for 10-Year Chart
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const maxVal = useMemo(() => {
    const highestVal = projectionData[projectionData.length - 1]?.projectedValue || purchasePrice * 2;
    return Math.ceil(highestVal * 1.1 / 200000) * 200000;
  }, [projectionData, purchasePrice]);

  const getY = (val) => innerH - (val / maxVal) * innerH + padding.top;
  const getX = (year) => padding.left + (year / 10) * innerW;

  const valuePoints = projectionData.map(d => `${getX(d.year)},${getY(d.projectedValue)}`).join(' ');
  const loanPoints = projectionData.map(d => `${getX(d.year)},${getY(d.remainingLoan)}`).join(' ');
  const areaPoints = `${getX(0)},${getY(projectionData[0].projectedValue)} ` +
    projectionData.map(d => `${getX(d.year)},${getY(d.projectedValue)}`).join(' ') +
    ` ${getX(10)},${innerH + padding.top} ${getX(0)},${innerH + padding.top}`;

  return (
    <div className="investment-calc-container">
      
      {/* Platform Breadcrumb & Title */}
      <div className="calc-header-section">
        <div className="calc-badge-row">
          <span className="badge badge-emerald">
            <Calculator size={14} className="icon-mr" />
            Australian Property Finance Engine
          </span>
          <span className="badge badge-subtle">
            Updated FY 2025/2026 State Revenue Brackets
          </span>
        </div>

        <div className="calc-title-row">
          <div>
            <h1 className="calc-main-title">Investment & Stamp Duty Calculator</h1>
            <p className="calc-subtitle">
              Model real-world Australian stamp duty concessions, cash flow holding costs, after-tax negative gearing benefits, and 10-year wealth progression prefilled by suburb.
            </p>
          </div>

          <div className="calc-header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              title="Print investment schedule"
            >
              <Printer size={15} />
              <span>Print Brief</span>
            </button>
            {currentSuburb && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenDossier && onOpenDossier(currentSuburb)}
                title="Open suburb full dossier"
              >
                <FileText size={15} />
                <span>View Dossier</span>
              </button>
            )}
          </div>
        </div>

        {/* Suburb Quick-Loader & Property Preset Bar */}
        <div className="suburb-prefill-toolbar glass-panel">
          <div className="toolbar-col suburb-select-col">
            <label className="toolbar-label">
              <MapPin size={13} /> Select Suburb:
            </label>
            <select 
              value={selectedSuburbId}
              onChange={(e) => handleSuburbChange(e.target.value)}
              className="toolbar-select"
            >
              {suburbs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}, {s.state} ({s.postcode}) — {s.badge}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-col prop-type-col">
            <label className="toolbar-label">Property Category:</label>
            <div className="type-toggle-pill">
              <button 
                className={`type-btn ${propertyType === 'house' ? 'active' : ''}`}
                onClick={() => handlePropertyTypeToggle('house')}
              >
                <Home size={14} />
                <span>House</span>
              </button>
              <button 
                className={`type-btn ${propertyType === 'unit' ? 'active' : ''}`}
                onClick={() => handlePropertyTypeToggle('unit')}
              >
                <Building size={14} />
                <span>Unit / Apt</span>
              </button>
            </div>
          </div>

          <div className="toolbar-col stats-strip-col">
            <div className="toolbar-stat">
              <span className="t-lbl">Median Price</span>
              <span className="t-val">{formatMillions(purchasePrice)}</span>
            </div>
            <div className="toolbar-stat">
              <span className="t-lbl">Weekly Rent</span>
              <span className="t-val text-green">${weeklyRent}/wk</span>
            </div>
            <div className="toolbar-stat">
              <span className="t-lbl">Gross Yield</span>
              <span className="t-val text-blue">{grossYield.toFixed(2)}%</span>
            </div>
            <div className="toolbar-stat">
              <span className="t-lbl">12m Capital Growth</span>
              <span className="t-val text-emerald">+{currentSuburb?.propertyMetrics.growth12mPercent}%</span>
            </div>
          </div>

          <button 
            className="btn-reset-median"
            onClick={handleResetToMedian}
            title="Reset purchase price and rent to suburb medians"
          >
            <RefreshCw size={13} />
            <span>Reset to Median</span>
          </button>
        </div>
      </div>

      {/* Top Level Macro KPI Strip */}
      <div className="calc-kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Total Upfront Cash</span>
            <DollarSign size={16} className="text-emerald" />
          </div>
          <div className="kpi-value text-emerald">{formatCurrency(totalUpfrontCash)}</div>
          <div className="kpi-meta">
            Deposit ({depositPercent}%) + Duty ({formatCurrency(stampDutyResult.dutyPayable)}) + Fees
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Stamp Duty ({effectiveState})</span>
            <FileText size={16} className="text-blue" />
          </div>
          <div className="kpi-value text-blue">
            {stampDutyResult.dutyPayable === 0 ? 'FREE ($0)' : formatCurrency(stampDutyResult.dutyPayable)}
          </div>
          <div className="kpi-meta">
            {stampDutyResult.discount > 0 ? (
              <span className="tag-discount">Saved {formatCurrency(stampDutyResult.discount)} (FHB Concession)</span>
            ) : (
              <span>Effective rate: {stampDutyResult.effectiveRate}%</span>
            )}
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Mortgage Repayment</span>
            <Calendar size={16} className="text-purple" />
          </div>
          <div className="kpi-value text-purple">{formatCurrency(activeRepaymentDisplay)}</div>
          <div className="kpi-meta">
            {repaymentFrequency.toUpperCase()} ({repaymentType === 'pi' ? 'Principal & Interest' : 'Interest Only'}) @ {interestRate}%
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">After-Tax Weekly Cash Flow</span>
            <TrendingUp size={16} className={afterTaxWeeklyCashFlow >= 0 ? 'text-green' : 'text-amber'} />
          </div>
          <div className={`kpi-value ${afterTaxWeeklyCashFlow >= 0 ? 'text-green' : 'text-amber'}`}>
            {afterTaxWeeklyCashFlow >= 0 ? `+${formatCurrency(afterTaxWeeklyCashFlow)}/wk` : `-${formatCurrency(Math.abs(afterTaxWeeklyCashFlow))}/wk`}
          </div>
          <div className="kpi-meta">
            {afterTaxWeeklyCashFlow >= 0 ? (
              <span className="tag-positive">Cash Flow Surplus</span>
            ) : (
              <span>Pre-tax: -{formatCurrency(Math.abs(preTaxWeeklyCashFlow))}/wk (Saves {formatCurrency(Math.round(annualTaxBenefit / 52))}/wk in tax)</span>
            )}
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">10-Yr Projected Equity</span>
            <Sparkles size={16} className="text-cyan" />
          </div>
          <div className="kpi-value text-cyan">
            {formatMillions(projectionData[10]?.netEquity)}
          </div>
          <div className="kpi-meta">
            Usable equity: {formatMillions(projectionData[10]?.usableEquity)} (at {capitalGrowthRate}% p.a.)
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Pills */}
      <div className="calc-tabs-bar">
        <button 
          className={`calc-tab-btn ${activeView === 'stamp-duty' ? 'active' : ''}`}
          onClick={() => setActiveView('stamp-duty')}
        >
          <DollarSign size={16} />
          <span>1. Stamp Duty & Upfront Capital</span>
        </button>

        <button 
          className={`calc-tab-btn ${activeView === 'cashflow' ? 'active' : ''}`}
          onClick={() => setActiveView('cashflow')}
        >
          <TrendingUp size={16} />
          <span>2. Holding Cash Flow & Negative Gearing</span>
        </button>

        <button 
          className={`calc-tab-btn ${activeView === 'projection' ? 'active' : ''}`}
          onClick={() => setActiveView('projection')}
        >
          <Sparkles size={16} />
          <span>3. 10-Year Wealth & Equity Trajectory</span>
        </button>
      </div>

      {/* VIEW 1: Stamp Duty & Upfront Capital Breakdown */}
      {activeView === 'stamp-duty' && (
        <div className="view-grid stamp-duty-view">
          
          {/* Left Form: Inputs */}
          <div className="calc-card glass-panel">
            <div className="card-section-header">
              <h2 className="card-title">Purchase & Stamp Duty Parameters</h2>
              <span className="card-subtitle">Configure buyer profile, property valuation and state jurisdiction</span>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label">Purchase Price</label>
                <div className="price-quick-adjusters">
                  <button onClick={() => setCustomPrice(Math.max(200000, purchasePrice - 50000))}>-$50k</button>
                  <button onClick={() => setCustomPrice(purchasePrice + 50000)}>+$50k</button>
                  <button onClick={handleResetToMedian}>Reset</button>
                </div>
              </div>
              <div className="input-currency-wrapper">
                <span className="prefix">$</span>
                <input 
                  type="number"
                  step="10000"
                  value={purchasePrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Buyer Persona</label>
              <div className="buyer-persona-group">
                <button 
                  className={`persona-btn ${buyerType === 'investor' ? 'active' : ''}`}
                  onClick={() => setBuyerType('investor')}
                >
                  <Building size={15} />
                  <div>
                    <strong>Property Investor</strong>
                    <span>Standard state investor transfer rate</span>
                  </div>
                </button>
                <button 
                  className={`persona-btn ${buyerType === 'owner_occupier' ? 'active' : ''}`}
                  onClick={() => setBuyerType('owner_occupier')}
                >
                  <Home size={15} />
                  <div>
                    <strong>Owner Occupier</strong>
                    <span>Primary place of residence rates</span>
                  </div>
                </button>
                <button 
                  className={`persona-btn ${buyerType === 'first_home' ? 'active' : ''}`}
                  onClick={() => setBuyerType('first_home')}
                >
                  <Sparkles size={15} />
                  <div>
                    <strong>First Home Buyer</strong>
                    <span>Eligible for state duty exemptions</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">State / Territory</label>
                <select 
                  value={effectiveState}
                  onChange={(e) => setStateOverride(e.target.value)}
                  className="form-select"
                >
                  {Object.keys(STATE_NAMES).map(st => (
                    <option key={st} value={st}>{st} — {STATE_NAMES[st]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Foreign Purchaser Surcharge</label>
                <label className="toggle-switch-label">
                  <input 
                    type="checkbox"
                    checked={isForeignBuyer}
                    onChange={(e) => setIsForeignBuyer(e.target.checked)}
                  />
                  <span>Foreign Buyer (+7–8% Surcharge)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label">Deposit Percentage & LVR</label>
                <span className="slider-readout">
                  <strong>{depositPercent}%</strong> ({formatCurrency(depositAmount)}) • LVR: {100 - depositPercent}%
                </span>
              </div>
              <input 
                type="range"
                min="5"
                max="50"
                step="5"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
                className="form-slider"
              />
              <div className="slider-ticks">
                <span>5% (High LMI)</span>
                <span>10%</span>
                <span className="tick-target">20% (No LMI)</span>
                <span>30%</span>
                <span>50%</span>
              </div>
            </div>

            {/* LMI Notice if LVR > 80% */}
            {depositPercent < 20 && (
              <div className="lmi-callout-panel">
                <div className="lmi-icon-col">
                  <AlertCircle size={18} className="text-amber" />
                </div>
                <div className="lmi-content-col">
                  <div className="lmi-title">Lenders Mortgage Insurance (LMI) Required</div>
                  <p className="lmi-desc">
                    Since your deposit is under 20% (LVR is {100 - depositPercent}%), lenders require LMI estimated at <strong>{formatCurrency(lmiAmount)}</strong>.
                  </p>
                  <label className="lmi-check-label">
                    <input 
                      type="checkbox"
                      checked={capitalizeLmi}
                      onChange={(e) => setCapitalizeLmi(e.target.checked)}
                    />
                    <span>Capitalize LMI into loan balance (adds to loan instead of upfront cash)</span>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Right Card: Full Upfront Cash Ledger Breakdown */}
          <div className="calc-card glass-panel ledger-card">
            <div className="card-section-header">
              <h2 className="card-title">Upfront Cash Outlay Breakdown</h2>
              <span className="card-subtitle">Required capital to complete settlement</span>
            </div>

            <div className="settlement-hero-box">
              <span className="shb-label">Total Cash Required at Settlement</span>
              <div className="shb-value">{formatCurrency(totalUpfrontCash)}</div>
              <span className="shb-sub">
                Comprising {formatCurrency(depositAmount)} equity deposit + {formatCurrency(totalUpfrontCash - depositAmount)} purchase on-costs.
              </span>
            </div>

            {/* Itemized Table */}
            <div className="ledger-table">
              <div className="ledger-row">
                <div className="ledger-label-group">
                  <span className="ledger-item-name">Property Deposit</span>
                  <span className="ledger-item-desc">{depositPercent}% of purchase price</span>
                </div>
                <span className="ledger-item-val">{formatCurrency(depositAmount)}</span>
              </div>

              <div className="ledger-row">
                <div className="ledger-label-group">
                  <span className="ledger-item-name">
                    Government Stamp Duty ({effectiveState})
                  </span>
                  <span className="ledger-item-desc">
                    {buyerType === 'first_home' && stampDutyResult.discount > 0 ? (
                      <span className="text-emerald">First Home Buyer concession applied (-{formatCurrency(stampDutyResult.discount)})</span>
                    ) : (
                      `Statutory transfer duty on ${formatCurrency(purchasePrice)}`
                    )}
                  </span>
                </div>
                <span className={`ledger-item-val ${stampDutyResult.dutyPayable === 0 ? 'text-green' : ''}`}>
                  {stampDutyResult.dutyPayable === 0 ? '$0 (Exempt)' : formatCurrency(stampDutyResult.dutyPayable)}
                </span>
              </div>

              {isForeignBuyer && (
                <div className="ledger-row">
                  <div className="ledger-label-group">
                    <span className="ledger-item-name">Foreign Buyer Duty Surcharge</span>
                    <span className="ledger-item-desc">8% additional statutory duty</span>
                  </div>
                  <span className="ledger-item-val text-amber">{formatCurrency(stampDutyResult.foreignSurcharge)}</span>
                </div>
              )}

              <div className="ledger-row">
                <div className="ledger-label-group">
                  <span className="ledger-item-name">Government Land Transfer & Reg Fee</span>
                  <span className="ledger-item-desc">Titles office mortgage & transfer registration</span>
                </div>
                <span className="ledger-item-val">{formatCurrency(govTransferFees)}</span>
              </div>

              <div className="ledger-row">
                <div className="ledger-label-group">
                  <span className="ledger-item-name">Conveyancing & Legal Fees</span>
                  <span className="ledger-item-desc">Contract review, searches, and settlement handling</span>
                </div>
                <span className="ledger-item-val">{formatCurrency(legalFees)}</span>
              </div>

              <div className="ledger-row">
                <div className="ledger-label-group">
                  <span className="ledger-item-name">Building, Pest & Strata Inspections</span>
                  <span className="ledger-item-desc">Independent pre-purchase technical inspection report</span>
                </div>
                <span className="ledger-item-val">{formatCurrency(inspectionFees)}</span>
              </div>

              {depositPercent < 20 && (
                <div className="ledger-row">
                  <div className="ledger-label-group">
                    <span className="ledger-item-name">LMI Premium</span>
                    <span className="ledger-item-desc">
                      {capitalizeLmi ? 'Capitalized into loan balance ($0 upfront)' : 'Paid upfront in cash at settlement'}
                    </span>
                  </div>
                  <span className="ledger-item-val">
                    {capitalizeLmi ? '$0 (Capitalized)' : formatCurrency(lmiAmount)}
                  </span>
                </div>
              )}

              <div className="ledger-row total-row">
                <span className="total-label">Total Out-of-Pocket Cash</span>
                <span className="total-val text-emerald">{formatCurrency(totalUpfrontCash)}</span>
              </div>
            </div>

            {/* State Legislation Advisory Notice */}
            <div className="state-rules-panel">
              <div className="srp-header">
                <Info size={14} className="text-blue" />
                <span>{effectiveState} Stamp Duty Policy Guide</span>
              </div>
              <p className="srp-text">
                {effectiveState === 'NSW' && (
                  'NSW First Home Buyers Assistance Scheme (FHBAS) grants full stamp duty exemption on homes up to $800,000, with concessional discounts sliding up to $1,000,000.'
                )}
                {effectiveState === 'VIC' && (
                  'Victoria provides complete stamp duty exemption for eligible first home buyers on purchases up to $600,000, with sliding concessions up to $750,000.'
                )}
                {effectiveState === 'QLD' && (
                  'Queensland offers a zero-duty first home concession up to $700,000 (expanded from $500,000 in recent state updates), with sliding relief up to $800,000.'
                )}
                {effectiveState === 'WA' && (
                  'Western Australia First Home Owner Rate of Duty offers zero stamp duty up to $450,000, with concessional rates up to $600,000.'
                )}
                {effectiveState === 'SA' && (
                  'South Australia provides stamp duty exemptions for first home buyers constructing or purchasing new residential homes.'
                )}
                {effectiveState === 'ACT' && (
                  'ACT operates an income-tested Home Buyer Concession Scheme eliminating duty for eligible buyers.'
                )}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: Mortgage & Holding Cash Flow */}
      {activeView === 'cashflow' && (
        <div className="view-grid cashflow-view">
          
          {/* Mortgage & Rental Inputs */}
          <div className="calc-card glass-panel">
            <div className="card-section-header">
              <h2 className="card-title">Financing & Loan Structure</h2>
              <span className="card-subtitle">Loan amount: {formatCurrency(totalLoanAmount)} (LVR: {100 - depositPercent}%)</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a.)</label>
                <div className="input-with-pill">
                  <input 
                    type="number"
                    step="0.05"
                    min="1"
                    max="15"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="form-input"
                  />
                  <span className="suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loan Term</label>
                <div className="term-selector-pills">
                  {[20, 25, 30].map(yr => (
                    <button 
                      key={yr}
                      className={`term-pill ${loanTermYears === yr ? 'active' : ''}`}
                      onClick={() => setLoanTermYears(yr)}
                    >
                      {yr} yrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Repayment Structure</label>
                <div className="repay-type-pills">
                  <button 
                    className={`term-pill ${repaymentType === 'pi' ? 'active' : ''}`}
                    onClick={() => setRepaymentType('pi')}
                  >
                    Principal & Interest
                  </button>
                  <button 
                    className={`term-pill ${repaymentType === 'io' ? 'active' : ''}`}
                    onClick={() => setRepaymentType('io')}
                  >
                    Interest Only
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Repayment Frequency</label>
                <div className="repay-type-pills">
                  {['monthly', 'fortnightly', 'weekly'].map(freq => (
                    <button 
                      key={freq}
                      className={`term-pill ${repaymentFrequency === freq ? 'active' : ''}`}
                      onClick={() => setRepaymentFrequency(freq)}
                    >
                      {freq.slice(0, 1).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-divider" />

            <div className="card-section-header">
              <h2 className="card-title">Rental Income & Property Outgoings</h2>
              <span className="card-subtitle">Model real-world maintenance, rates, and management expenses</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Weekly Rental Income</label>
                <div className="input-currency-wrapper">
                  <span className="prefix">$</span>
                  <input 
                    type="number"
                    step="25"
                    value={weeklyRent}
                    onChange={(e) => setCustomWeeklyRent(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vacancy Allowance</label>
                <div className="input-with-pill">
                  <input 
                    type="number"
                    min="0"
                    max="10"
                    value={vacancyWeeks}
                    onChange={(e) => setVacancyWeeks(Number(e.target.value))}
                    className="form-input"
                  />
                  <span className="suffix">weeks / yr</span>
                </div>
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Council Rates / yr</label>
                <input 
                  type="number"
                  step="50"
                  value={councilRatesAnnual}
                  onChange={(e) => setCouncilRatesAnnual(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Water Rates / yr</label>
                <input 
                  type="number"
                  step="50"
                  value={waterRatesAnnual}
                  onChange={(e) => setWaterRatesAnnual(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Strata / Body Corp</label>
                <input 
                  type="number"
                  step="100"
                  value={strataAnnual}
                  onChange={(e) => setStrataAnnual(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Insurance / yr</label>
                <input 
                  type="number"
                  step="50"
                  value={insuranceAnnual}
                  onChange={(e) => setInsuranceAnnual(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Repairs / yr</label>
                <input 
                  type="number"
                  step="50"
                  value={repairsAnnual}
                  onChange={(e) => setRepairsAnnual(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agent Mgmt Fee</label>
                <div className="input-with-pill">
                  <input 
                    type="number"
                    step="0.5"
                    value={managementFeeRate}
                    onChange={(e) => setManagementFeeRate(Number(e.target.value))}
                    className="form-input"
                  />
                  <span className="suffix">%</span>
                </div>
              </div>
            </div>

            <div className="card-divider" />

            <div className="card-section-header">
              <h2 className="card-title">Negative Gearing & Tax Relief Profile</h2>
              <span className="card-subtitle">Marginal tax rate bracket & annual capital works depreciation</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Marginal Tax Bracket (ATO)</label>
                <select 
                  value={marginalTaxRate}
                  onChange={(e) => setMarginalTaxRate(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={0}>0% (Tax-Free Threshold)</option>
                  <option value={16}>16% ($18,201 – $45,000)</option>
                  <option value={30}>30% ($45,001 – $135,000)</option>
                  <option value={37}>37% ($135,001 – $190,000)</option>
                  <option value={45}>45% ($190,001+ High Earner)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Div 43/40 Building Depreciation</label>
                <div className="input-currency-wrapper">
                  <span className="prefix">$</span>
                  <input 
                    type="number"
                    step="500"
                    value={annualDepreciation}
                    onChange={(e) => setAnnualDepreciation(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Card: Cash Flow Statement */}
          <div className="calc-card glass-panel ledger-card">
            <div className="card-section-header">
              <h2 className="card-title">Holding Cash Flow & Tax Statement</h2>
              <span className="card-subtitle">Weekly & annual bottom-line comparison</span>
            </div>

            {/* Visual Cash Flow Hero Card */}
            <div className={`cashflow-highlight-box ${afterTaxWeeklyCashFlow >= 0 ? 'surplus' : 'shortfall'}`}>
              <div className="chb-top-tag">
                {afterTaxWeeklyCashFlow >= 0 ? 'NET CASH FLOW POSITIVE' : 'NET HOLDING OUT-OF-POCKET'}
              </div>
              <div className="chb-main-number">
                {afterTaxWeeklyCashFlow >= 0 
                  ? `+${formatCurrency(afterTaxWeeklyCashFlow)}/wk`
                  : `-${formatCurrency(Math.abs(afterTaxWeeklyCashFlow))}/wk`
                }
              </div>
              <div className="chb-annual-sub">
                {afterTaxAnnualCashFlow >= 0
                  ? `Annual Net Surplus: +${formatCurrency(afterTaxAnnualCashFlow)}`
                  : `Annual Net Holding Shortfall: -${formatCurrency(Math.abs(afterTaxAnnualCashFlow))}`
                }
              </div>
              <div className="chb-tax-benefit-banner">
                <Sparkles size={14} className="text-emerald" />
                <span>
                  ATO Tax Deduction saves you <strong>{formatCurrency(Math.round(annualTaxBenefit / 52))}/wk</strong> ({formatCurrency(annualTaxBenefit)} / year)
                </span>
              </div>
            </div>

            {/* Income & Expense Breakdown */}
            <div className="cashflow-ledger-table">
              
              <div className="cf-section-title">1. Rental Income</div>
              <div className="ledger-row">
                <span className="cf-lbl">Gross Rental Income ({occupiedWeeks} weeks)</span>
                <span className="cf-val text-green">+{formatCurrency(annualGrossRent)} / yr</span>
              </div>

              <div className="cf-section-title">2. Property Outgoings</div>
              <div className="ledger-row">
                <span className="cf-lbl">Management Fees ({managementFeeRate}%)</span>
                <span className="cf-val">-{formatCurrency(annualManagementFee)}</span>
              </div>
              <div className="ledger-row">
                <span className="cf-lbl">Council & Water Rates</span>
                <span className="cf-val">-{formatCurrency(Number(councilRatesAnnual) + Number(waterRatesAnnual))}</span>
              </div>
              {Number(strataAnnual) > 0 && (
                <div className="ledger-row">
                  <span className="cf-lbl">Strata / Body Corporate</span>
                  <span className="cf-val">-{formatCurrency(strataAnnual)}</span>
                </div>
              )}
              <div className="ledger-row">
                <span className="cf-lbl">Insurance & Maintenance Allowance</span>
                <span className="cf-val">-{formatCurrency(Number(insuranceAnnual) + Number(repairsAnnual))}</span>
              </div>
              <div className="ledger-row subtotal-row">
                <span className="cf-lbl"><strong>Net Rental Income</strong> (Net Yield: {netYield.toFixed(2)}%)</span>
                <span className="cf-val text-blue"><strong>{formatCurrency(netRentalIncome)} / yr</strong></span>
              </div>

              <div className="cf-section-title">3. Mortgage Repayments</div>
              <div className="ledger-row">
                <span className="cf-lbl">
                  Mortgage ({repaymentType === 'pi' ? 'Principal & Interest' : 'Interest Only'} @ {interestRate}%)
                </span>
                <span className="cf-val text-amber">-{formatCurrency(mortgageResult.annual)} / yr</span>
              </div>
              <div className="ledger-row subtotal-row">
                <span className="cf-lbl"><strong>Pre-Tax Cash Flow</strong></span>
                <span className={`cf-val ${preTaxAnnualCashFlow >= 0 ? 'text-green' : 'text-amber'}`}>
                  <strong>{preTaxAnnualCashFlow >= 0 ? '+' : ''}{formatCurrency(preTaxAnnualCashFlow)} / yr ({formatCurrency(preTaxWeeklyCashFlow)}/wk)</strong>
                </span>
              </div>

              <div className="cf-section-title">4. Tax Negative Gearing Shield</div>
              <div className="ledger-row">
                <span className="cf-lbl">Deductible Interest & Expenses</span>
                <span className="cf-val">{formatCurrency(annualDeductibleInterest + totalAnnualOutgoings)}</span>
              </div>
              <div className="ledger-row">
                <span className="cf-lbl">Depreciation Allowance (Div 43/40)</span>
                <span className="cf-val">{formatCurrency(annualDepreciation)}</span>
              </div>
              <div className="ledger-row">
                <span className="cf-lbl">Tax Refund @ {effectiveMarginalTaxRate}% Bracket</span>
                <span className="cf-val text-emerald">+{formatCurrency(annualTaxBenefit)} / yr</span>
              </div>

              <div className="ledger-row total-row">
                <span className="total-label">True After-Tax Cash Flow</span>
                <span className={`total-val ${afterTaxWeeklyCashFlow >= 0 ? 'text-green' : 'text-amber'}`}>
                  {afterTaxWeeklyCashFlow >= 0 ? '+' : ''}{formatCurrency(afterTaxWeeklyCashFlow)} / week
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: 10-Year Wealth & Equity Trajectory */}
      {activeView === 'projection' && (
        <div className="projection-view">
          
          <div className="calc-card glass-panel projection-main-card">
            <div className="chart-controls-strip">
              <div>
                <h2 className="card-title">10-Year Capital Growth & Net Equity Trajectory</h2>
                <span className="card-subtitle">
                  Visualizing property valuation compounding vs mortgage balance amortization
                </span>
              </div>

              <div className="growth-preset-pills">
                <span className="gp-label">Annual Growth Rate:</span>
                <button 
                  className={`gp-pill ${capitalGrowthRate === 3.5 ? 'active' : ''}`}
                  onClick={() => setCapitalGrowthRate(3.5)}
                >
                  Conservative (3.5%)
                </button>
                <button 
                  className={`gp-pill ${capitalGrowthRate === defaultGrowth ? 'active' : ''}`}
                  onClick={() => setCapitalGrowthRate(defaultGrowth)}
                >
                  Suburb Trend ({defaultGrowth}%)
                </button>
                <button 
                  className={`gp-pill ${capitalGrowthRate === 8.5 ? 'active' : ''}`}
                  onClick={() => setCapitalGrowthRate(8.5)}
                >
                  Bullish (8.5%)
                </button>
                <div className="custom-growth-input">
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={capitalGrowthRate}
                    onChange={(e) => setCapitalGrowthRate(Number(e.target.value))}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Multi-Series Chart */}
            <div className="svg-chart-container">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="projection-svg-chart"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const yVal = innerH - ratio * innerH + padding.top;
                  const labelVal = Math.round(ratio * maxVal);
                  return (
                    <g key={idx}>
                      <line 
                        x1={padding.left} 
                        y1={yVal} 
                        x2={chartWidth - padding.right} 
                        y2={yVal} 
                        stroke="rgba(255,255,255,0.08)" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={padding.left - 10} 
                        y={yVal + 4} 
                        fill="rgba(255,255,255,0.4)" 
                        fontSize="11" 
                        textAnchor="end"
                      >
                        {formatMillions(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Years */}
                {[0, 2, 4, 6, 8, 10].map(yr => (
                  <text 
                    key={yr}
                    x={getX(yr)} 
                    y={chartHeight - 8} 
                    fill="rgba(255,255,255,0.6)" 
                    fontSize="11" 
                    textAnchor="middle"
                  >
                    Yr {yr}
                  </text>
                ))}

                {/* Area Gradient under Projected Value */}
                <polygon points={areaPoints} fill="url(#equityGrad)" />

                {/* Loan Balance Amortization Line */}
                <polyline 
                  points={loanPoints} 
                  fill="none" 
                  stroke="#F43F5E" 
                  strokeWidth="2.5" 
                  strokeDasharray="5 5"
                />

                {/* Projected Value Line */}
                <polyline 
                  points={valuePoints} 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="3.5" 
                />

                {/* Data Points on Projected Line */}
                {projectionData.map((d) => {
                  const cx = getX(d.year);
                  const cy = getY(d.projectedValue);
                  const isHovered = hoveredYear === d.year;
                  return (
                    <g 
                      key={d.year} 
                      className="svg-point-group"
                      onMouseEnter={() => setHoveredYear(d.year)}
                      onMouseLeave={() => setHoveredYear(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isHovered ? 7 : 4.5} 
                        fill="#10B981" 
                        stroke="#0F172A" 
                        strokeWidth="2" 
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Chart Legend */}
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot bg-emerald" />
                  <span>Projected Property Value ({capitalGrowthRate}% p.a.)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot bg-rose dashed" />
                  <span>Remaining Mortgage Principal ({repaymentType.toUpperCase()})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot bg-cyan" />
                  <span>Equity Gap (Shaded Green)</span>
                </div>
              </div>

              {/* Interactive Tooltip Inspector Banner */}
              {hoveredYear !== null && projectionData[hoveredYear] && (
                <div className="chart-inspector-banner glass-panel">
                  <div className="cib-col">
                    <span className="cib-lbl">Year {hoveredYear} Valuation</span>
                    <span className="cib-val text-emerald">{formatCurrency(projectionData[hoveredYear].projectedValue)}</span>
                  </div>
                  <div className="cib-col">
                    <span className="cib-lbl">Remaining Debt</span>
                    <span className="cib-val text-rose">{formatCurrency(projectionData[hoveredYear].remainingLoan)}</span>
                  </div>
                  <div className="cib-col">
                    <span className="cib-lbl">Total Net Equity</span>
                    <span className="cib-val text-cyan">{formatCurrency(projectionData[hoveredYear].netEquity)}</span>
                  </div>
                  <div className="cib-col">
                    <span className="cib-lbl">Usable Equity (80% LVR)</span>
                    <span className="cib-val text-green">{formatCurrency(projectionData[hoveredYear].usableEquity)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 10-Year Milestones Grid */}
            <div className="milestones-grid">
              {[1, 3, 5, 10].map(yr => {
                const item = projectionData[yr];
                if (!item) return null;
                return (
                  <div key={yr} className="milestone-card glass-panel">
                    <div className="mc-header">
                      <span className="mc-year">Year {yr} Milestone</span>
                      <span className="mc-gain text-green">+{formatMillions(item.capitalGain)} Gain</span>
                    </div>
                    <div className="mc-value">{formatMillions(item.projectedValue)}</div>
                    <div className="mc-details">
                      <div className="mc-line">
                        <span>Remaining Debt:</span>
                        <span>{formatMillions(item.remainingLoan)}</span>
                      </div>
                      <div className="mc-line">
                        <span>Net Equity:</span>
                        <strong className="text-cyan">{formatMillions(item.netEquity)}</strong>
                      </div>
                      <div className="mc-line usable-equity-highlight">
                        <span>Usable Equity for Next Deposit:</span>
                        <strong className="text-emerald">{formatMillions(item.usableEquity)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* Suburb Intelligence & Research Next Steps Footer */}
      <div className="calc-footer-strip glass-panel">
        <div className="cfs-info">
          <h4>Researching {currentSuburb?.name}, {currentSuburb?.state}?</h4>
          <p>
            Explore micro-demographics, ACARA school catchments, GTFS transport connectivity, and street-level micro-pockets in the live dossier.
          </p>
        </div>
        <div className="cfs-actions">
          <button 
            className="btn btn-primary"
            onClick={() => onOpenDossier && onOpenDossier(currentSuburb)}
          >
            <span>Explore {currentSuburb?.name} Dossier</span>
            <ArrowUpRight size={15} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onAddToCompare && onAddToCompare(currentSuburb)}
          >
            <Scale size={15} />
            <span>Add to Compare</span>
          </button>
        </div>
      </div>

    </div>
  );
}
export default InvestmentCalculator;
