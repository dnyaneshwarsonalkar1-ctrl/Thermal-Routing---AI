# 🌿 coolroute — AI Thermal Logistics Control Center

> **Dynamic non-refrigerated produce rescue & perishability-aware routing for smallholder agriculture.**  
> *(GM University Hackathon AI26AG02 Prototype)*

---

## 📌 Problem Statement

Shortest route is not always the safest route. Traditional GPS navigation optimizes purely for distance or travel time, ignoring the thermal impact on perishable agricultural goods. 

In India and emerging markets, over **80% of smallholder produce transit operates without cold chain refrigeration**. Standard navigation systems inadvertently guide harvest trucks onto sun-baked national highways where ambient tarmac temperatures often exceed 38°C—accelerating cellular breakdown, moisture loss, and rot.

**coolroute** is an AI-powered bio-thermal routing platform that dynamically balances travel time, road distance, and radiant heat exposure to maximize harvest quality upon arrival at the APMC Mandi hub.

---

## 🏗️ Architecture

The platform features a **two-page modern architecture** with zero-downtime offline failover:

```
├── frontend/
│   ├── index.html            # Marketing Landing Page (Overview, Pipeline, Testimonials, FAQ)
│   ├── dashboard.html        # Live Command Center (Interactive GIS Map, Decay Optimizer)
│   ├── landing.css           # Softly Design System styles for Landing Page
│   ├── styles.css            # Daylight tactical theme for Command Center
│   ├── js/
│   │   ├── app.js            # Main dashboard controller & in-transit simulation
│   │   ├── routing.js        # OSRM client with intelligent rate limiting & waypoint synthesis
│   │   ├── thermalModel.js   # Q10 biophysical decay mathematics engine
│   │   ├── weather.js        # Open-Meteo batched microclimate fetcher
│   │   └── config.js         # Geographic coordinates, crop profiles, scoring weights
│   ├── fallback_routes.json  # Pre-cached regional OSRM routing alternatives
│   └── fallback_weather.json # Pre-cached Open-Meteo road temperature grid
├── backend/
│   ├── server.js             # Express API (Multi-route decay scoring & APMC mandi analytics)
│   └── package.json          # Backend dependencies
├── skills/                   # Automated validation suites
│   ├── test-backend.js       # 5/5 automated backend test suite
│   ├── test-frontend-integration.js # 23/23 frontend & decay integration test suite
│   └── audit-two-page.js     # 26/26 architecture & design system audit
├── docs/                     # Design documents & execution plan
│   ├── PLAN.md
│   └── DESIGN.md
├── package.json              # Root project orchestration scripts
└── .gitignore                # Production Git sanitization rules
```

### 1. Landing Page (`/` or `index.html`)
- **Hero & Scenario Explorer**: Problem walkthrough showing how temperature spikes destroy produce value.
- **9-Step Pipeline Architecture**: End-to-end breakdown from sensor telemetry to APMC mandi auction.
- **Farmer Impact Testimonials**: Case studies showing real-world rupee savings.
- **Direct App Launch CTA**: One-click launch into the live command center.

### 2. Live Command Center (`/dashboard` or `dashboard.html`)
- **Leaflet GIS Map**: Daylight cartography with interactive checkpoint temperature markers (`CP1`, `CP2`, `CP3`).
- **Multi-Corridor Generation**: Evaluates up to 4 distinct road corridors simultaneously.
- **Microclimate Weather Grid**: Batched API calls to Open-Meteo capturing road temperatures.
- **APMC Mandi Benchmark Section**: Real-time commodity benchmark rates for Davanagere Mandi and dynamic cargo valuation.
- **Custom Lab Crop Tuner (`🧪`)**: Lab sandbox enabling researchers to tune baseline $T_{\text{ref}}$, decay sensitivity $k$, and market price for any crop.
- **Continuous In-Transit Telemetry HUD**: Floating live telemetry HUD tracking segment temperatures, progressive quality decay, and journey progress with instant dismiss capability.

---

## 🔬 Core Biophysical Decay Model

The core engine models produce respiration and senescence using the biological **$Q_{10}$ temperature coefficient** ($Q_{10} = 2.0$):

1. **Heat Factor:**
   $$\text{Heat Factor} = 2^{\frac{T - T_{\text{ref}}}{10}}$$

2. **Cumulative Thermal Load:**
   $$\text{Thermal Load} = \sum_{i=1}^{N} \left( \Delta t_i \times \text{Heat Factor}_i \right)$$

3. **Arrival Quality Decay ($Q$):**
   $$Q_{\text{arrival}} = 100 \times e^{-k \times \text{Thermal Load}}$$

4. **Multi-Objective Composite Score:**
   $$\text{Score} = (0.20 \times t_{\text{hours}}) + (0.05 \times d_{\text{km}}) + (0.75 \times (100 - Q_{\text{arrival}})) + (\text{deadlineBreached} ? 500 : 0)$$

### Produce Baseline Parameters

| Produce Variety | Baseline $T_{\text{ref}}$ (°C) | Decay Constant ($k$) | Davanagere APMC Rate |
| :--- | :---: | :---: | :---: |
| **Tomato** | 13.0°C | 0.012 | ₹36.50 / kg |
| **Leafy Greens** | 10.0°C | 0.022 | ₹42.00 / kg |
| **Mango** | 13.0°C | 0.009 | ₹88.00 / kg |
| **Potato / Onion** | 15.0°C | 0.003 | ₹22.00 / kg |
| **Custom Lab Crop** | *Configurable* | *Configurable* | *Configurable* |

---

## 💰 APMC Mandi Economic Value Model

The optimizer calculates the direct monetary savings preserved by choosing the AI-recommended thermal route over the hottest suboptimal route:

$$\text{Value Preserved (₹)} = \text{Cargo Weight (kg)} \times \text{Rate (₹/kg)} \times \frac{Q_{\text{Recommended}} - Q_{\text{Worst}}}{100}$$

For a standard 1,000 kg shipment of tomatoes, preserving just 1.0% additional cellular quality saves approximately **₹365 – ₹372** per transit run.

---

## 🛡️ Offline Resilience & Failover

To guarantee zero downtime in rural regions with intermittent internet connectivity:
- **Server Offline Fallback:** If the backend (Port 5000) is unreachable, the in-browser client seamlessly switches to client-side heuristics.
- **OSRM Fallback:** If the public OSRM server times out or rate-limits, the engine automatically serves `fallback_routes.json`.
- **Weather Grid Fallback:** If Open-Meteo is unavailable, segment temperatures fall back to pre-cached local thermal grids (`fallback_weather.json`).
- Zero API calls occur on UI slider adjustments, ensuring instantaneous responsiveness.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm`

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/coolroute-thermal-routing.git
cd coolroute-thermal-routing
npm install
```

### Running the Application

1. **Start the Backend API Server:**
   ```bash
   npm start
   ```
   *Backend runs on `http://localhost:5000`.*

2. **Start the Frontend Web Server:**
   In a separate terminal:
   ```bash
   npm run serve:frontend
   ```
   *Frontend serves on `http://localhost:3000`.*

3. **Open in Browser:**
   - **Landing Page:** `http://localhost:3000/`
   - **Live Command Center:** `http://localhost:3000/dashboard.html` (or `http://localhost:3000/dashboard`)

---

## 🧪 Automated Test Suites

The codebase includes comprehensive automated test suites:

```bash
# Run all test suites
npm test

# Run backend unit & optimization tests (5/5 checks)
npm run test:backend

# Run frontend integration & decay tests (23/23 checks)
npm run test:frontend

# Run two-page architecture & design system audit (26/26 checks)
npm run test:audit
```

---

## 📜 Attributions & Third-Party APIs

- **Routing Engine:** [OSRM (Open Source Routing Machine)](http://project-osrm.org/)
- **Meteorological Data:** [Open-Meteo Microclimate API](https://open-meteo.com/)
- **Cartography & Tiles:** &copy; [OpenStreetMap](https://www.openstreetmap.org/) contributors via [Leaflet.js](https://leafletjs.com/)
- **Typography:** Google Fonts (*Outfit*, *Reenie Beanie*)

---

## 📄 License
MIT License. Built for hackathon demonstration and open research.
