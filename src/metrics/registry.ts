export type MetricSlot = {
  id: string;
  label: string;
  unit?: string;
  group?: string;
  context?: string;
  map?: boolean;
};

export type SeriesSlot = {
  id: string;
  label: string;
  unit?: string;
  group?: string;
};

export type TableSlot = {
  id: string;
  label: string;
  group?: string;
  columns: { id: string; label: string }[];
};

export type PlaceGroup = { id: string; label: string };

export type SectionKind = "metrics" | "score" | "nearby" | "commute";

export type SectionConfig = {
  id: string;
  nav: string;
  kicker: string;
  title: string;
  lede: string;
  aside?: string;
  kind?: SectionKind;
  tabs?: { id: string; label: string }[];
  slots?: MetricSlot[];
  series?: SeriesSlot[];
  tables?: TableSlot[];
  placeGroups?: PlaceGroup[];
};

const offenceColumns = [
  { id: "offence", label: "Offence" },
  { id: "category", label: "Category" },
  { id: "count", label: "Count" },
];

/**
 * Suburb page sections. A new metric is one entry in this array.
 * Leave `kind` unset to use the generic metrics renderer.
 */
export const registry: SectionConfig[] = [
  {
    id: "score",
    nav: "Overview",
    kicker: "01 — Reading",
    title: "Composite",
    lede: "A midpoint of 50, then draft points for access, offences, and mapped hazards.",
    aside: "A blank row means that input is not loaded. It does not mean the input scored zero.",
    kind: "score",
  },
  {
    id: "housing",
    nav: "Housing",
    kicker: "02 — Cost",
    title: "Housing",
    lede: "Rent, sale prices, and how long stock sits on the market.",
    tabs: [
      { id: "rent", label: "Rent" },
      { id: "buy", label: "Buy" },
    ],
    slots: [
      { id: "median-rent", label: "Median weekly rent", unit: "$/week", group: "rent", map: true },
      { id: "rentals-counted", label: "Rentals counted", unit: "listings", group: "rent" },
      { id: "rent-change", label: "Average annual rent change", unit: "%", group: "rent" },
      { id: "rent-1bed", label: "One-bedroom median", unit: "$/week", group: "rent" },
      { id: "rent-2bed", label: "Two-bedroom median", unit: "$/week", group: "rent" },
      { id: "rent-3bed", label: "Three-bedroom median", unit: "$/week", group: "rent" },
      { id: "rent-house", label: "House rent", unit: "$/week", group: "rent" },
      { id: "rent-unit", label: "Unit rent", unit: "$/week", group: "rent" },
      { id: "renters-pct", label: "Households renting", unit: "%", group: "rent" },
      { id: "median-house", label: "Median house price", unit: "$", group: "buy", map: true },
      { id: "median-unit", label: "Median unit price", unit: "$", group: "buy" },
      { id: "house-growth-5y", label: "House price change, 5 years", unit: "%", group: "buy" },
      { id: "house-growth-10y", label: "House price change, 10 years", unit: "%", group: "buy" },
      { id: "days-on-market", label: "Days on market", unit: "days", group: "buy" },
      { id: "clearance", label: "Auction clearance", unit: "%", group: "buy" },
      { id: "yield", label: "Gross rental yield", unit: "%", group: "buy" },
      { id: "vacancy", label: "Vacancy rate", unit: "%", group: "buy" },
      { id: "approvals", label: "New dwelling approvals", unit: "count", group: "buy" },
    ],
    series: [
      { id: "rent-trend", label: "Median weekly rent", unit: "$/week", group: "rent" },
      { id: "house-price", label: "Median house price", unit: "$", group: "buy" },
      { id: "unit-price", label: "Median unit price", unit: "$", group: "buy" },
    ],
  },
  {
    id: "education",
    nav: "Education",
    kicker: "03 — Schools",
    title: "Education",
    lede: "Early learning, primary, and secondary schools, with government zones where published.",
    slots: [
      { id: "zone-share", label: "Share inside a government school zone", unit: "%" },
      { id: "school-count", label: "Schools counted", unit: "schools" },
    ],
    placeGroups: [
      { id: "early", label: "Early learning" },
      { id: "primary", label: "Primary" },
      { id: "secondary", label: "Secondary" },
    ],
  },
  {
    id: "transport",
    nav: "Transport",
    kicker: "04 — Movement",
    title: "Transport",
    lede: "Train, tram, bus, and regional rail within a short walk.",
    slots: [
      { id: "train", label: "Train lines within 1 km", unit: "lines" },
      { id: "tram", label: "Tram lines within 1 km", unit: "lines" },
      { id: "bus", label: "Bus routes within 1 km", unit: "routes" },
      { id: "regional-rail", label: "Regional rail within 1 km", unit: "lines" },
    ],
    placeGroups: [{ id: "stops", label: "Stops" }],
  },
  {
    id: "emergency",
    nav: "Emergency",
    kicker: "05 — Response",
    title: "Emergency services",
    lede: "Nearest police, ambulance, fire brigade, and hospital.",
    placeGroups: [
      { id: "police", label: "Police" },
      { id: "ambulance", label: "Ambulance" },
      { id: "fire", label: "Fire" },
      { id: "hospital", label: "Hospital" },
    ],
    slots: [{ id: "gp-note", label: "GP clinics", context: "Often absent from open data" }],
  },
  {
    id: "crime",
    nav: "Crime",
    kicker: "06 — Offences",
    title: "Crime",
    lede: "Reported offences per 1,000 residents, beside the state median when one is published.",
    aside:
      "Rates follow footfall. A busy centre can look worse than a quiet street with the same chance of harm.",
    slots: [
      {
        id: "person-rate",
        label: "Offences against the person",
        unit: "per 1,000",
        context: "State median",
        map: true,
      },
      {
        id: "property-rate",
        label: "Property offences",
        unit: "per 1,000",
        context: "State median",
      },
      {
        id: "deception-rate",
        label: "Deception offences",
        unit: "per 1,000",
        context: "State median",
      },
      { id: "youth-rate", label: "Youth offending, council", unit: "per 1,000 aged 10–17" },
    ],
    series: [
      { id: "person-trend", label: "Offences against the person", unit: "per 1,000" },
      { id: "property-trend", label: "Property offences", unit: "per 1,000" },
    ],
    tables: [{ id: "offence-types", label: "Offence types", columns: offenceColumns }],
  },
  {
    id: "hazards",
    nav: "Hazards",
    kicker: "07 — Overlays",
    title: "Hazards",
    lede: "Flood and bushfire planning overlays, plus recorded history where a dataset has it.",
    aside: "An overlay is a planning map. It is not a forecast for one house.",
    slots: [
      { id: "exposure", label: "Exposure label" },
      { id: "lsio-pct", label: "Land subject to inundation", unit: "%" },
      { id: "sbo-pct", label: "Special building overlay", unit: "%" },
      { id: "bushfire-pct", label: "Bushfire overlay", unit: "%" },
    ],
    placeGroups: [
      { id: "safer-places", label: "Safer places" },
      { id: "water-points", label: "Water points" },
    ],
  },
  {
    id: "amenities",
    nav: "Amenities",
    kicker: "08 — Daily",
    title: "Amenities",
    lede: "Parks, sport, groceries, and the other places a week actually uses.",
    placeGroups: [
      { id: "parks", label: "Parks and play" },
      { id: "sport", label: "Sport" },
      { id: "community", label: "Community" },
      { id: "library", label: "Library and culture" },
      { id: "groceries", label: "Groceries" },
      { id: "pharmacy", label: "Pharmacy" },
    ],
  },
  {
    id: "census",
    nav: "Census",
    kicker: "09 — People",
    title: "Census",
    lede: "Age, income, household size, and how the population is changing.",
    slots: [
      { id: "median-age", label: "Median age", unit: "years" },
      { id: "median-income", label: "Median household income", unit: "$/week" },
      { id: "household-size", label: "Average household size", unit: "people" },
      { id: "born-overseas", label: "Born overseas", unit: "%" },
      { id: "year-12", label: "Year 12 or equivalent", unit: "%" },
      { id: "unemployment", label: "Unemployment", unit: "%" },
      { id: "population-growth", label: "Population change", unit: "%" },
    ],
  },
  {
    id: "naplan",
    nav: "NAPLAN",
    kicker: "10 — Learning",
    title: "NAPLAN",
    lede: "School results where the testing agency publishes them. A missing school is not a zero.",
    slots: [
      { id: "reading", label: "Reading", context: "National mean" },
      { id: "numeracy", label: "Numeracy", context: "National mean" },
      { id: "writing", label: "Writing", context: "National mean" },
    ],
  },
  {
    id: "heat",
    nav: "Heat",
    kicker: "11 — Climate",
    title: "Heat",
    lede: "Hot days and summer temperature, from the climate record rather than a single season.",
    slots: [
      { id: "hot-days", label: "Days over 35°C", unit: "days/year", map: true },
      { id: "summer-max", label: "Mean summer maximum", unit: "°C" },
    ],
    series: [{ id: "hot-day-trend", label: "Days over 35°C", unit: "days" }],
  },
  {
    id: "noise",
    nav: "Noise",
    kicker: "12 — Sound",
    title: "Noise",
    lede: "Road and aircraft noise where a contour map exists.",
    slots: [
      { id: "road-noise", label: "Road noise exposure" },
      { id: "aircraft-noise", label: "Aircraft noise contour" },
    ],
  },
  {
    id: "canopy",
    nav: "Canopy",
    kicker: "13 — Shade",
    title: "Tree canopy",
    lede: "Share of the suburb covered by canopy, and whether that share is moving.",
    slots: [
      { id: "canopy-pct", label: "Canopy cover", unit: "%", map: true },
      { id: "canopy-change", label: "Change, 5 years", unit: "percentage points" },
    ],
  },
  {
    id: "lifestyle",
    nav: "Lifestyle",
    kicker: "14 — After hours",
    title: "Lifestyle",
    lede: "Cafes, food, markets, and clubs. Counts, not reviews.",
    placeGroups: [
      { id: "cafes", label: "Cafes and restaurants" },
      { id: "markets", label: "Markets" },
      { id: "arts", label: "Arts venues" },
      { id: "clubs", label: "Sports clubs" },
      { id: "beaches", label: "Beaches and pools" },
    ],
  },
  {
    id: "development",
    nav: "Development",
    kicker: "15 — Change",
    title: "Planned development",
    lede: "Rezonings and projects large enough to be on a public list.",
    tables: [
      {
        id: "projects",
        label: "Projects",
        columns: [
          { id: "name", label: "Project" },
          { id: "kind", label: "Kind" },
          { id: "status", label: "Status" },
        ],
      },
    ],
  },
  {
    id: "commute",
    nav: "Commute",
    kicker: "16 — Time",
    title: "Commute",
    lede: "Travel time to an address you enter. Public transport, driving, and cycling.",
    kind: "commute",
  },
  {
    id: "nearby",
    nav: "Nearby",
    kicker: "17 — Around",
    title: "Nearby suburbs",
    lede: "Places that share a boundary, once the geometry is loaded.",
    kind: "nearby",
  },
];

export function mapMetrics(): { id: string; label: string }[] {
  const metrics = [{ id: "score", label: "Composite" }];
  for (const section of registry) {
    for (const slot of section.slots ?? []) {
      if (slot.map) metrics.push({ id: slot.id, label: slot.label });
    }
  }
  return metrics;
}
