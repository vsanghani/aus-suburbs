// Australian Property Finance, Stamp Duty & Cash Flow Calculations
// Accurate modeling aligned with state revenue offices and Australian banking standards

export const STATE_NAMES = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  ACT: 'Australian Capital Territory'
};

/**
 * Calculate Australian Stamp Duty (Transfer Duty) based on State, Price, Buyer Type, and Foreign status
 */
export function calculateStampDuty(price, state = 'NSW', buyerType = 'investor', isForeign = false) {
  if (!price || price <= 0) return { standardDuty: 0, dutyPayable: 0, discount: 0, foreignSurcharge: 0 };

  let standardDuty = 0;
  let dutyPayable = 0;
  let discount = 0;
  let foreignRate = 0.08; // 8% across most states (WA/SA is 7%)

  const s = state.toUpperCase();

  switch (s) {
    case 'NSW': {
      // NSW Standard Transfer Duty
      if (price <= 17000) {
        standardDuty = Math.max(10, price * 0.0125);
      } else if (price <= 36000) {
        standardDuty = 212 + (price - 17000) * 0.015;
      } else if (price <= 97000) {
        standardDuty = 497 + (price - 36000) * 0.02;
      } else if (price <= 360000) {
        standardDuty = 1717 + (price - 97000) * 0.035;
      } else if (price <= 1200000) {
        standardDuty = 10922 + (price - 360000) * 0.045;
      } else if (price <= 3600000) {
        standardDuty = 48722 + (price - 1200000) * 0.055;
      } else {
        standardDuty = 180722 + (price - 3600000) * 0.07;
      }

      dutyPayable = standardDuty;

      // NSW First Home Buyers Assistance Scheme (FHBAS)
      if (buyerType === 'first_home') {
        if (price <= 800000) {
          dutyPayable = 0;
          discount = standardDuty;
        } else if (price <= 1000000) {
          const ratio = (price - 800000) / 200000;
          dutyPayable = standardDuty * ratio;
          discount = standardDuty - dutyPayable;
        }
      }
      break;
    }

    case 'VIC': {
      // VIC Standard Transfer Duty
      if (price <= 25000) {
        standardDuty = price * 0.014;
      } else if (price <= 130000) {
        standardDuty = 350 + (price - 25000) * 0.024;
      } else if (price <= 960000) {
        standardDuty = 2870 + (price - 130000) * 0.06;
      } else {
        standardDuty = price * 0.055;
      }

      dutyPayable = standardDuty;

      // VIC First Home Buyer Exemption / Concession
      if (buyerType === 'first_home') {
        if (price <= 600000) {
          dutyPayable = 0;
          discount = standardDuty;
        } else if (price <= 750000) {
          const ratio = (price - 600000) / 150000;
          dutyPayable = standardDuty * ratio;
          discount = standardDuty - dutyPayable;
        }
      }
      break;
    }

    case 'QLD': {
      // QLD has separate Home Concession vs Investor rates
      if (buyerType === 'investor') {
        if (price <= 5000) {
          standardDuty = 0;
        } else if (price <= 75000) {
          standardDuty = (price - 5000) * 0.015;
        } else if (price <= 540000) {
          standardDuty = 1050 + (price - 75000) * 0.035;
        } else if (price <= 1000000) {
          standardDuty = 17325 + (price - 540000) * 0.045;
        } else {
          standardDuty = 38025 + (price - 1000000) * 0.0575;
        }
        dutyPayable = standardDuty;
      } else {
        // Owner Occupier Home Concession
        if (price <= 350000) {
          standardDuty = price * 0.01;
        } else if (price <= 540000) {
          standardDuty = 3500 + (price - 350000) * 0.035;
        } else if (price <= 1000000) {
          standardDuty = 10150 + (price - 540000) * 0.045;
        } else {
          standardDuty = 30850 + (price - 1000000) * 0.0575;
        }
        dutyPayable = standardDuty;

        // QLD First Home Concession
        if (buyerType === 'first_home') {
          if (price <= 700000) {
            dutyPayable = 0;
            discount = standardDuty;
          } else if (price <= 800000) {
            const ratio = (price - 700000) / 100000;
            dutyPayable = standardDuty * ratio;
            discount = standardDuty - dutyPayable;
          }
        }
      }
      break;
    }

    case 'WA': {
      foreignRate = 0.07;
      if (price <= 120000) {
        standardDuty = price * 0.019;
      } else if (price <= 150000) {
        standardDuty = 2280 + (price - 120000) * 0.0285;
      } else if (price <= 360000) {
        standardDuty = 3135 + (price - 150000) * 0.038;
      } else if (price <= 725000) {
        standardDuty = 11115 + (price - 360000) * 0.0475;
      } else {
        standardDuty = 28453 + (price - 725000) * 0.0515;
      }
      dutyPayable = standardDuty;

      if (buyerType === 'first_home') {
        if (price <= 450000) {
          dutyPayable = 0;
          discount = standardDuty;
        } else if (price <= 600000) {
          dutyPayable = (price - 450000) * 0.1501;
          discount = Math.max(0, standardDuty - dutyPayable);
        }
      }
      break;
    }

    case 'SA': {
      foreignRate = 0.07;
      if (price <= 12000) {
        standardDuty = price * 0.01;
      } else if (price <= 30000) {
        standardDuty = 120 + (price - 12000) * 0.02;
      } else if (price <= 50000) {
        standardDuty = 480 + (price - 30000) * 0.03;
      } else if (price <= 100000) {
        standardDuty = 1080 + (price - 50000) * 0.04;
      } else if (price <= 200000) {
        standardDuty = 3080 + (price - 100000) * 0.045;
      } else if (price <= 250000) {
        standardDuty = 7580 + (price - 200000) * 0.05;
      } else if (price <= 300000) {
        standardDuty = 10080 + (price - 250000) * 0.055;
      } else if (price <= 500000) {
        standardDuty = 12830 + (price - 300000) * 0.055;
      } else {
        standardDuty = 23830 + (price - 500000) * 0.055;
      }
      dutyPayable = standardDuty;
      break;
    }

    case 'ACT': {
      if (price <= 260000) {
        standardDuty = price * 0.012;
      } else if (price <= 300000) {
        standardDuty = 3120 + (price - 260000) * 0.022;
      } else if (price <= 500000) {
        standardDuty = 4000 + (price - 300000) * 0.034;
      } else if (price <= 750000) {
        standardDuty = 10800 + (price - 500000) * 0.043;
      } else if (price <= 1000000) {
        standardDuty = 21550 + (price - 750000) * 0.06;
      } else if (price <= 1455000) {
        standardDuty = 36550 + (price - 1000000) * 0.065;
      } else {
        standardDuty = price * 0.0454;
      }
      dutyPayable = standardDuty;
      break;
    }

    default:
      standardDuty = price * 0.045;
      dutyPayable = standardDuty;
  }

  const foreignSurcharge = isForeign ? price * foreignRate : 0;
  dutyPayable = Math.round(dutyPayable + foreignSurcharge);

  return {
    standardDuty: Math.round(standardDuty),
    dutyPayable: Math.max(0, dutyPayable),
    discount: Math.round(discount),
    foreignSurcharge: Math.round(foreignSurcharge),
    effectiveRate: ((dutyPayable / price) * 100).toFixed(2)
  };
}

/**
 * Estimate Lenders Mortgage Insurance (LMI) for loan-to-value ratios over 80%
 */
export function estimateLmi(loanAmount, propertyValue) {
  if (!propertyValue || propertyValue <= 0 || !loanAmount || loanAmount <= 0) return 0;
  const lvr = (loanAmount / propertyValue) * 100;
  if (lvr <= 80) return 0;

  // Approximate bank tier percentage based on LVR band
  let rate = 0;
  if (lvr <= 85) rate = 0.011;
  else if (lvr <= 90) rate = 0.021;
  else if (lvr <= 95) rate = 0.033;
  else rate = 0.042;

  return Math.round(loanAmount * rate);
}

/**
 * Calculate Monthly & Period Mortgage Repayment
 */
export function calculateMortgageRepayment({
  loanAmount,
  interestRateAnnual,
  loanTermYears = 30,
  repaymentType = 'pi' // 'pi' | 'io'
}) {
  if (!loanAmount || loanAmount <= 0) {
    return { monthly: 0, fortnightly: 0, weekly: 0, annual: 0, totalInterest: 0 };
  }

  const r = (interestRateAnnual / 100) / 12; // monthly rate
  const n = loanTermYears * 12; // total monthly payments

  let monthly = 0;
  let totalInterest = 0;

  if (repaymentType === 'io' || r === 0) {
    monthly = loanAmount * r;
    totalInterest = monthly * n;
  } else {
    monthly = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    totalInterest = (monthly * n) - loanAmount;
  }

  const annual = monthly * 12;
  const fortnightly = annual / 26;
  const weekly = annual / 52;

  return {
    monthly: Math.round(monthly),
    fortnightly: Math.round(fortnightly),
    weekly: Math.round(weekly),
    annual: Math.round(annual),
    totalInterest: Math.round(totalInterest)
  };
}

/**
 * Calculate 10-Year Capital Appreciation, Debt Amortization & Net Equity Progression
 */
export function calculateTenYearProjection({
  purchasePrice,
  initialLoan,
  interestRateAnnual,
  capitalGrowthRateAnnual = 6.0,
  loanTermYears = 30,
  repaymentType = 'pi'
}) {
  const r = (interestRateAnnual / 100) / 12;
  const totalMonths = loanTermYears * 12;
  const g = capitalGrowthRateAnnual / 100;

  const projection = [];

  for (let year = 0; year <= 10; year++) {
    const projectedValue = Math.round(purchasePrice * Math.pow(1 + g, year));
    
    let remainingLoan = initialLoan;
    if (year === 0) {
      remainingLoan = initialLoan;
    } else if (repaymentType === 'io') {
      remainingLoan = initialLoan;
    } else {
      // Amortization balance formula
      const m = year * 12;
      if (m >= totalMonths) {
        remainingLoan = 0;
      } else {
        remainingLoan = Math.round(
          initialLoan * (Math.pow(1 + r, totalMonths) - Math.pow(1 + r, m)) / (Math.pow(1 + r, totalMonths) - 1)
        );
      }
    }

    const netEquity = projectedValue - remainingLoan;
    // Standard Australian bank lending allows borrowing up to 80% LVR without LMI
    const usableEquity = Math.max(0, Math.round((projectedValue * 0.8) - remainingLoan));
    const capitalGain = projectedValue - purchasePrice;

    projection.push({
      year,
      projectedValue,
      remainingLoan,
      netEquity,
      usableEquity,
      capitalGain
    });
  }

  return projection;
}
