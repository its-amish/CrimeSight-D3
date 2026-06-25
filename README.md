# CrimeSight — Data-Driven Insights for Public Safety

A fully client-side **D3.js** data-visualization dashboard for exploring crime patterns across major Indian cities. The dashboard is built on a single-page HTML/CSS/JS architecture with no build step — just open `index.html` in a browser (via a local HTTP server).

---

## 📸 Overview

CrimeSight provides four coordinated, interactive views that update in unison as the user applies filters:

| View | What it shows |
|---|---|
| **India City Hotspots** (symbol map) | Crime report volume per city as proportional circles on a Mercator map of India |
| **Time Hotspots** (heatmap) | Crime frequency by weekday × hour-of-day |
| **Police Deployment vs Case Closure** (scatter plot) | Relationship between the number of officers deployed and days taken to close a case |
| **Victim Demographics Analysis** (population pyramid + trend line) | Age-group breakdown by gender (Male ↔ Female diverging bars) overlaid with a yearly crime-count trend line |

---

## 🗂️ Project Structure

```
CrimeSight-D3/
├── index.html          # Entry point — layout and script wiring
├── style.css           # Global styles, CSS custom properties (design tokens)
├── visuals.pdf         # Design reference / static preview of the charts
├── data/
│   └── crime_dataset_india.csv   # ~4.7 MB raw dataset
└── js/
    ├── preprocess.js   # Parses & normalises CSV rows into typed records
    ├── main.js         # App bootstrap, shared state, filter controls, render loop
    ├── mapView.js      # Symbol map + time heatmap (both rendered together)
    ├── scatterView.js  # Scatter plot — police deployed vs days to close
    └── demographicView.js  # Population pyramid + yearly trend line
```

---

## 🚀 Getting Started

Because the app loads the CSV with `d3.csv()` (a `fetch` call), you **must** serve the files over HTTP — opening `index.html` directly as a `file://` URL will be blocked by browser CORS policy.

### Option A — Python (no install required)

```bash
# Python 3
cd CrimeSight-D3
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

### Option B — Node.js `serve`

```bash
npx serve .
```

### Option C — VS Code Live Server extension

Right-click `index.html` → **Open with Live Server**.

---

## 🛠️ Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [D3.js](https://d3js.org/) | v7 (CDN) | All chart rendering, scales, axes, data transforms |
| [TopoJSON client](https://github.com/topojson/topojson-client) | v3 (CDN) | Decoding the world-atlas TopoJSON for India's boundary |
| [world-atlas](https://github.com/topojson/world-atlas) | 110m (CDN) | Country boundary GeoJSON used to render the India basemap |

No npm, no bundler, no framework — everything runs in the browser.

---

## 📊 Dataset

**File:** `data/crime_dataset_india.csv` (~4.7 MB)

The CSV is expected to have (at minimum) the following columns:

| Column | Description |
|---|---|
| `City` | City name (one of 29 mapped cities) |
| `Crime Description` | Free-text crime type |
| `Crime Domain` | High-level category: `Violent`, `Property`, or `Cyber` |
| `Date Reported` | `DD-MM-YYYY HH:MM` |
| `Date of Occurrence` | `DD-MM-YYYY HH:MM` |
| `Time of Occurrence` | `DD-MM-YYYY HH:MM` |
| `Police Deployed` | Integer count of officers |
| `Victim Age` | Numeric age |
| `Victim Gender` | `Male` / `M` / `Female` / `F` |
| `Case Closed` | `Yes` / `No` (or `true`/`false`/`1`) |
| `Date Case Closed` | `DD-MM-YYYY HH:MM` (used only when case is closed) |

### Preprocessing (`preprocess.js`)

All raw string values are cleaned and typed before any chart renders:

- **Dates** parsed with `d3.timeParse("%d-%m-%Y %H:%M")`.
- `year`, `hour`, `weekday` extracted from the parsed date.
- **Gender** normalised to `"Male"` or `"Female"`.
- **Crime Domain** normalised to `"Violent"`, `"Property"`, or `"Cyber"`.
- `Case Closed` → boolean; `daysToClose` computed from `Date Reported` → `Date Case Closed`.

---

## 🎛️ Filters & Interactions

### Dropdown filters (top of page)

| Control | Effect |
|---|---|
| **City** | Restrict all charts to a single city |
| **Crime Description** | Restrict all charts to a specific crime type |
| **Year** | Restrict all charts to a single year |

All three filters are combined (AND logic) and immediately re-render every chart.

### Chart interactions

| Chart | Interaction |
|---|---|
| **Map** | Click a city bubble → toggle `cityFilter` (syncs the dropdown) |
| **Heatmap** | Click a cell → toggle hour + weekday filter; **Shift-click** → toggle hour only |
| **Scatter legend** | Click a crime-domain label → highlight only that domain across scatter & map |

All interactions update `window.app.state` and trigger a full re-render via `render()`.

---

## 🏗️ Architecture

```
window.app (shared singleton, set up in main.js)
├── state            — city, crime, year, domain, hour, weekday
├── palette          — stable color map (reads CSS custom properties)
├── showTooltip()    — display the floating tooltip
├── moveTooltip()    — keep tooltip in viewport
├── hideTooltip()    — hide tooltip
├── toggleCity()     — toggle state.city & sync dropdown
├── toggleDomain()   — toggle state.domain
├── toggleHour()     — toggle state.hour
└── toggleWeekday()  — toggle state.weekday
```

Each view module exposes a single `draw*()` function that is **stateless** — it receives the current filtered data, state, and palette as arguments and draws from scratch into its SVG element every render cycle.

Script load order (declared in `index.html`):

```
preprocess.js  →  mapView.js  →  scatterView.js  →  demographicView.js  →  main.js
```

`main.js` runs last and wires everything together; it is the only file that owns `window.app` and calls the draw functions.

---

## 🎨 Design Tokens

All colours are declared as CSS custom properties in `style.css` and read at runtime by `main.js` via `getComputedStyle`. This means the palette can be themed purely from CSS.

```css
--cat-1: #4e79a7  /* Property crimes / Male */
--cat-2: #f28e2b  /* Cyber crimes */
--cat-3: #e15759  /* Violent crimes / Female */
--cat-4: #76b7b2  /* Other */
--male:   var(--cat-1)
--female: var(--cat-3)
```

---

## 📝 Notes & Limitations

- The India basemap boundary is fetched from the jsDelivr CDN (`world-atlas@2`) — an internet connection is required on first load. Subsequent renders reuse the cached promise (`_indiaPromise`).
- Cities without hard-coded coordinates in `mapView.js` will appear as "missing" and are counted in the small annotation rendered at the bottom of the map.
- The demographic chart (`demographicView.js`) contains a commented-out earlier implementation of a simple grouped bar chart; the active implementation uses a diverging population pyramid with an overlaid yearly trend line.
- There is no server-side component; all filtering and aggregation runs in the browser.
