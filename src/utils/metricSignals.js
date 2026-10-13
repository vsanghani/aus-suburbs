// SuburbIQ decision signals — original bands for this seed dataset.
// Green / amber / red tell the user what the number means, not just the number.

export const SIGNAL_META = {
  green: { id: 'green', label: 'Strong', short: 'Strong' },
  amber: { id: 'amber', label: 'Watch', short: 'Watch' },
  red: { id: 'red', label: 'Caution', short: 'Caution' }
};

export const THRESHOLDS = {
  score: { green: 80, amber: 65 },
  growth12m: { green: 7, amber: 4 },
  houseYield: { green: 4.0, amber: 3.0 },
  unitYield: { green: 4.5, amber: 3.5 },
  daysOnMarket: { green: 25, amber: 35, invert: true },
  clearance: { green: 70, amber: 60 },
  incomePremiumPct: { green: 20, amber: 0 },
  icsea: { green: 1100, amber: 1000 }
};

export function bandSignal(value, green, amber, invert = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'amber';
  const n = Number(value);
  if (invert) {
    if (n <= green) return 'green';
    if (n <= amber) return 'amber';
    return 'red';
  }
  if (n >= green) return 'green';
  if (n >= amber) return 'amber';
  return 'red';
}

export function scoreSignal(score) {
  return bandSignal(score, THRESHOLDS.score.green, THRESHOLDS.score.amber);
}

export function icseaSignal(icsea) {
  return bandSignal(icsea, THRESHOLDS.icsea.green, THRESHOLDS.icsea.amber);
}

function signalItem(key, label, value, display, level, why) {
  return { key, label, value, display, level, why, meta: SIGNAL_META[level] };
}

export function buildSuburbSignals(suburb) {
  if (!suburb) return { items: [], counts: { green: 0, amber: 0, red: 0 }, headline: '' };

  const pm = suburb.propertyMetrics;
  const ls = suburb.lifestyleScores;
  const demo = suburb.demographics;
  const incomePremium = ((demo.weeklyHouseholdIncome - demo.stateAvgWeeklyIncome) / demo.stateAvgWeeklyIncome) * 100;

  const schools = suburb.amenities?.topSchools || [];
  const avgIcsea = schools.length
    ? schools.reduce((sum, school) => sum + school.icsea, 0) / schools.length
    : null;

  const items = [
    signalItem(
      'overall',
      'Liveability',
      ls.overallScore,
      `${ls.overallScore}/100`,
      scoreSignal(ls.overallScore),
      'Composite lifestyle index versus this metropolitan set.'
    ),
    signalItem(
      'growth',
      '12-month growth',
      pm.growth12mPercent,
      `+${pm.growth12mPercent}%`,
      bandSignal(pm.growth12mPercent, THRESHOLDS.growth12m.green, THRESHOLDS.growth12m.amber),
      'Capital growth over the last 12 months.'
    ),
    signalItem(
      'houseYield',
      'House yield',
      pm.houseRentalYield,
      `${pm.houseRentalYield}%`,
      bandSignal(pm.houseRentalYield, THRESHOLDS.houseYield.green, THRESHOLDS.houseYield.amber),
      'Gross rental yield on the median house.'
    ),
    signalItem(
      'unitYield',
      'Unit yield',
      pm.unitRentalYield,
      `${pm.unitRentalYield}%`,
      bandSignal(pm.unitRentalYield, THRESHOLDS.unitYield.green, THRESHOLDS.unitYield.amber),
      'Gross rental yield on the median unit.'
    ),
    signalItem(
      'velocity',
      'Market velocity',
      pm.daysOnMarket,
      `${pm.daysOnMarket} days`,
      bandSignal(pm.daysOnMarket, THRESHOLDS.daysOnMarket.green, THRESHOLDS.daysOnMarket.amber, true),
      'Days on market used as a tightness proxy. Vacancy is not in this dataset.'
    ),
    signalItem(
      'clearance',
      'Auction clearance',
      pm.clearanceRatePercent,
      `${pm.clearanceRatePercent}%`,
      bandSignal(pm.clearanceRatePercent, THRESHOLDS.clearance.green, THRESHOLDS.clearance.amber),
      'Share of auctions that sold — a demand heat check.'
    ),
    signalItem(
      'income',
      'Income vs state',
      Number(incomePremium.toFixed(1)),
      `${incomePremium >= 0 ? '+' : ''}${Math.round(incomePremium)}%`,
      bandSignal(incomePremium, THRESHOLDS.incomePremiumPct.green, THRESHOLDS.incomePremiumPct.amber),
      'Median household income versus the state average.'
    ),
    signalItem(
      'family',
      'Family living',
      ls.familyLiving,
      `${ls.familyLiving}/100`,
      scoreSignal(ls.familyLiving),
      'Schools, parks, and family suitability.'
    ),
    signalItem(
      'transit',
      'Transit & walk',
      ls.transitWalk,
      `${ls.transitWalk}/100`,
      scoreSignal(ls.transitWalk),
      'Walkability and public transport access.'
    ),
    signalItem(
      'safety',
      'Safety',
      ls.safetyCommunity,
      `${ls.safetyCommunity}/100`,
      scoreSignal(ls.safetyCommunity),
      'Community safety and cohesion score.'
    )
  ];

  if (avgIcsea !== null) {
    items.push(signalItem(
      'schools',
      'School ICSEA',
      Math.round(avgIcsea),
      String(Math.round(avgIcsea)),
      icseaSignal(avgIcsea),
      'Average ICSEA of listed catchment schools (1000 is the national mean).'
    ));
  }

  const counts = items.reduce(
    (acc, item) => {
      acc[item.level] += 1;
      return acc;
    },
    { green: 0, amber: 0, red: 0 }
  );

  const headline = `${counts.green} strong · ${counts.amber} watch · ${counts.red} caution`;

  return { items, counts, headline, incomePremium, avgIcsea };
}
