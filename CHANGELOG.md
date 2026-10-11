# Changelog

All notable changes to the **SuburbIQ** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Integration with live ABS Census TableBuilder API & GeoJSON boundary polygons.
- Historical 10-year capital appreciation charts using SVG time-series.
- Climate, flood, and bushfire risk overlay layers.
- Australian property investment cash flow & stamp duty calculator.

---

## [0.2.0] - 2026-10-11

### Micro-Pocket & Street-Level Explorer

#### Added
- **Street-by-Street Micro-Pocket Dataset (`src/data/suburbsData.js`)**:
  - Enriched all 15 Australian metropolitan suburbs with 3 unique micro-meshblock pockets each (45 distinct street-level enclaves).
  - Modeled pocket-level metrics: noise ratings & energy index (0–100), parking ease, walk score, price disparities vs suburb medians, key street names, traffic volumes, and dominant resident personas.
- **MicroPocketExplorer Component (`src/components/MicroPocketExplorer.jsx`, `src/components/MicroPocketExplorer.css`)**:
  - Built interactive pocket selector pills with noise indicators and price disparity badges.
  - Developed deep-dive single pocket viewer featuring streetscape architecture narratives, micro-scores quartet (Vibe, Quiet, Convenience, Family), and key streets tag cloud.
  - Implemented in-suburb **Head-to-Head Pocket Showdown** mode allowing users to compare two pockets of the same suburb side-by-side.
- **Dossier & Explorer Integration**:
  - Added dedicated **"Street & Micro-Pockets"** tab to the Suburb Dossier modal (`SuburbDossier.jsx`).
  - Added micro-pockets preview chip on all suburb cards in `HeroExplore.jsx`.
  - Added **Micro-Pocket Street Enclaves** section to the printable executive briefing in `ReportModal.jsx` and updated print styles (`ReportModal.css`).

---

## [0.1.0] - 2026-10-10

### Initial Foundation Release

#### Added
- **Project Scaffolding & Core Architecture**:
  - Initialized React 19 + Vite project structure with fast HMR support.
  - Setup clean Vanilla CSS design tokens with Midnight Slate (`#090D16`), Deep Navy (`#0F172A`), and Neon Emerald (`#10B981`) palette.
  - Imported modern typography via Google Fonts (`Plus Jakarta Sans` and `Outfit`).
  - Added Lucide React icon suite.

- **Data Models & Australian Suburb Intelligence Dataset (`src/data/suburbsData.js`)**:
  - Modeled micro-demographic and property metrics across 23 key metropolitan enclaves spanning Sydney (NSW), Melbourne (VIC), Brisbane (QLD), Perth (WA), Adelaide (SA), Canberra (ACT), and Gold Coast.
  - Formulated 6 proprietary lifestyle scores (Vibe & Culture, Family Living, Greenery & Tranquility, Transit & Walkability, Affluence & Economic Power, Safety & Community).
  - Integrated ABS Census tables (household income, age, household structures, tenure mix, cultural ancestries) and ACARA school performance (ICSEA ratings).

- **Interactive Geospatial Map (`src/components/SuburbMap.jsx`)**:
  - Integrated Leaflet map with CartoDB Voyager raster tiles.
  - Added dimension switching to color-code map pins by Overall IQ, Vibe & Culture, Family Score, Transit & Walk, Median House Price, or Rental Yield %.
  - Built custom interactive HTML `DivIcon` map pins with score badges.
  - Added floating quick-peek suburb cards with direct links to full dossiers.

- **Micro-Demographic Dossier Modal (`src/components/SuburbDossier.jsx`)**:
  - Built comprehensive modal with key property statistics strip (Median House, Median Unit, 12m Growth, Yield, Days on Market, Clearance Rate).
  - Four dedicated analytical tabs:
    - **Lifestyle Scores**: Visual progress gauges benchmarked against state averages.
    - **Micro-Demographics**: Household income comparison meters, family composition breakdowns, tenure ratios, and top cultural ancestries.
    - **Schools & Amenities**: School catchments with ICSEA ratings, transport hubs, parks, and cafe density statistics.
    - **Pocket Character**: Local strengths, considerations/cautions, ideal resident profiles, and infrastructure development pipelines.

- **Side-by-Side Suburb Comparison Engine (`src/components/SuburbComparison.jsx`)**:
  - Implemented 3-way head-to-head comparison tool (pre-seeded with Surry Hills NSW vs Fitzroy VIC vs New Farm QLD).
  - Added automated category champion badges for Highest Growth, Top Yield, and Category Leaders across property, lifestyle, and demographic dimensions.

- **Suburb Matchmaker Recommendation Tool (`src/components/SuburbMatchmaker.jsx`)**:
  - Added interactive criteria sliders for budget ($500k to $4.5M), property type (houses vs apartments), minimum vibe, family suitability, CBD distance, and rental yield.
  - Built real-time affinity scoring algorithm ranking matching enclaves with explicit match rationale chips.

- **National Suburb League Table (`src/components/ScorecardIndex.jsx`)**:
  - Created master searchable and multi-column sortable table for all Australian suburbs.

- **Executive Report Modal (`src/components/ReportModal.jsx`)**:
  - Designed clean printable/exportable Executive Suburb Intelligence Brief with print stylesheet (`@media print`) and PDF generation support.

- **Documentation & System Topology (`README.md`)**:
  - Authored comprehensive internal engineering handbook including ASCII/Mermaid end-to-end architecture diagrams, file tree annotations, component hierarchies, backend microservice specifications, PostgreSQL + PostGIS database schemas, mathematical score normalization algorithms, and Docker deployment workflows.
