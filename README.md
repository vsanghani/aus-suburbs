# SuburbIQ 🇦🇺
### Australian Suburb & Micro-Demographic Intelligence Engine

> Inspired by the core premise of Microburbs — reimagined with modern spatial heatmaps, live lifestyle scoring indices, side-by-side comparison showdowns, and automated buyer matchmaking.

---

## 🌟 What is SuburbIQ?
While traditional Australian real estate platforms (Domain, RealEstate.com.au) focus solely on individual listing advertisements, **SuburbIQ** provides **hyper-local micro-demographic and liveability intelligence**. It reveals *who* lives in a suburb, the true street-level lifestyle vibe, educational catchments, crime & safety ratings, and economic growth fundamentals across Australia's capital city enclaves.

---

## 🚀 Key Feature Suite

### 1. 🗺️ Interactive Spatial Map & Heatmaps
- High-contrast geospatial Leaflet map with CartoDB Voyager tiles.
- Dynamic dimension switching:
  - **Overall SuburbIQ Index**
  - **Vibe & Culture Index** (cafe density, dining, arts, nightlife)
  - **Family Living Score** (school rankings, playgrounds, quiet streets)
  - **Transit & Walkability** (train stations, walk score, CBD commute)
  - **Median House Price** ($M)
  - **Rental Yield %** (investor cashflow potential)
- Interactive pins with live metric badges and smooth camera transitions.

### 2. 📑 Micro-Demographic Suburb Dossier (The "Microburb" Sheet)
- **Lifestyle Scores Matrix**: 6 proprietary percentile scores benchmarks against state averages.
- **ABS Census Breakdown**:
  - Weekly Household Income compared against state average with percentage differential.
  - Household composition (Couples without children, Families with children, Single living).
  - Housing tenure mix (Renters vs Paying Mortgage vs Owned Outright).
  - Education & professional occupation rates.
  - Top cultural ancestries.
- **Schools & Infrastructure Catchments**:
  - ICSEA school ratings and proximity.
  - Heavy rail, metro, ferry, and light rail corridors.
  - Parklands and green canopy cover.
  - Cafe density (venues per km²) and landmark dining spots.
- **Pocket Insights & Local Character**:
  - Strengths and capital growth drivers.
  - Points of consideration / cautions.
  - Ideal resident archetypes and future planning projects.

### 3. ⚔️ Side-by-Side Suburb Comparison
- Head-to-head comparison of up to 3 suburbs (e.g. *Surry Hills NSW* vs *Fitzroy VIC* vs *New Farm QLD*).
- Category-by-category showdown with automated category champion badges (Highest Growth, Top Yield, Category Leaders).

### 4. 🎯 Suburb Matchmaker Engine
- Customizable criteria sliders:
  - Maximum Budget ($500k to $4.5M)
  - Property Type (House vs Apartment/Unit)
  - Minimum Vibe & Culture Priority
  - Minimum Family Suitability
  - Maximum Distance to CBD
  - Minimum Rental Yield %
- Instant affinity scoring algorithm ranking matches with explicit explanations.

### 5. 📊 National Suburb League Table
- Sortable master table across all Australian metropolitan areas.
- Sort by growth, yield, median price, distance to CBD, or lifestyle scores.

### 6. 🖨️ Printable Executive Suburb Intelligence Brief
- Clean, print-ready PDF/paper document layout (`window.print()`) formatted for property buyers, buyers agents, and investors.

---

## 🛠️ Tech Stack & Architecture
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS Design Tokens (Midnight Slate `#090D16` & Neon Emerald `#10B981` palette, Glassmorphism, CSS Variables, no Tailwind dependencies)
- **Icons**: Lucide React
- **Mapping**: Leaflet with custom HTML markers & CartoDB tiles
- **Typography**: Plus Jakarta Sans & Outfit (Google Fonts)

---

## 🏃 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.
