# Thermal Routing for Perishability Decay

## Overview
AG02 "Thermal Routing for Perishability Decay" is a logistics dashboard designed to optimize routing for perishable goods across smallholder farms and central processing facilities. 

## Phases

### Phase 0: MVP Implementation (Complete)
- [x] Scaffold base project files (`index.html`, `styles.css`, `js/config.js`, `js/app.js`).
- [x] Initialize Leaflet map with a modern UI layout (Sidebar + Map area).
- [x] Configure coordinates for Davanagere (Hub) and farms in Harihar, Honnali, and Jagalur.
- [x] Render distinct markers (Blue for Hub, Green for Farms).
- [x] Implement control panel for produce selection and cargo weight input.
- [x] Set up basic event handling and console logging for routing actions.
- [x] Integrate OSRM (Open Source Routing Machine) routing service.
- [x] Implement local fallback handling for routing API failures.
- [x] Draw route polylines on the map based on the generated path.
- [x] Calculate real distances and estimated travel times.
- [x] Apply decay algorithms based on produce type, time, and external temperature.
- [x] Visualize decay risk along the route.
- [x] Add loading states and error handling UI.
- [x] Optimize performance.
- [x] Implement real-time Heatwave Stress Test slider.
- [x] Develop animated dispatch simulation with in-transit telemetry HUD.
- [x] Ensure in-memory local math updates (Zero API calls during slider events).

### Phase 1: UI/UX Architecture (Complete)
- [x] Define spatial perspective, color tokens, and micro-interactions (`DESIGN.md`).

### Phase 2: Backend Integration (Complete)
- [x] Implement the complete Express backend in `server.js`.
- [x] Integrate backend with routing and weather models.
- [x] Wire frontend to query backend API with client-side failover.
- [x] Run automated test suite (`test-backend.js`) to verify endpoints and SLA decay math.
- [x] Recalibrate thermal decay factors for realistic road logistics and inject Rupee Economic Savings badge.
- [x] Generate and render 4 distinct routes concurrently with custom z-index styling.
- [x] Refine map UI with layered z-index routes, numbered stop badges, and intermediate thermal checkpoints.
- [x] Wire Custom Crop `T_ref`, `k`, and `Mandi Price` into Multi-Farm Pickup loops and UI calculations.
- [x] Implement interactive "📍 Custom Farm Location / Waypoint Picker" with map-click detection, 1-click regional presets (Ranebennur, Channagiri, Chitradurga), and dynamic corridor generation.
- [x] Upgrade Multi-Farm Pickup to full Dual Waypoint control: customize both Farm 1 (Stop A) and Farm 2 (Stop B) via dedicated `#multi-farm-waypoints-tray`, 1-click presets (Harihar, Ranebennur, Honnali, Channagiri), crosshair map clicking (`#pick-farm1-btn` and `#pick-farm2-btn`), dynamic sequence permutation routing (`Farm 1 → Farm 2 → Hub` vs `Farm 2 → Farm 1 → Hub`), and numbered map badges.
- [x] Restore Custom Crop / Lab Tuner (`#toggle-custom-crop-btn` and `#custom-crop-tray`) with non-colliding coexistence alongside Custom Location Pickers in the sidebar.
- [x] Integrate real-time Karnataka APMC Davanagere Mandi benchmark display with live sync timestamp, crop-linked market rates, and automatic batch valuation calculations.
- [x] Interactive selective route transit simulation: users can click ANY route card (e.g. hot highway trap) to focus its polyline, dim other routes, and run live dispatch animation with progressive real-time biophysical decay and color-shifting HUD telemetry.
- [x] Broadcast-Grade Command Center Visual Polish:
  * Custom glassmorphic Leaflet zoom controls with cyan accent & muted subtle attributions.
  * Command Center header with vibrant cyan-to-emerald gradient typography ("THERMAL ROUTE") and status pills (`● LIVE SENSORS`, `FAILOVER: READY`).
  * High-impact CTAs: glowing emerald "Calculate Optimal Route" button & neon-cyan "Start Dispatch Journey" button.
  * Route comparison cards hierarchy: emerald-glowing AI RECOMMENDED card with solid emerald capsule badge vs muted alternatives.
  * Laptop viewport fit: fixed 410px sidebar width with internal scrolling (1366x768 / 1080p fit) and seamless 100% map width.
- [x] Prepare live demo script and stress-test the slider.
- [x] Finalize presentation deck.

### Phase 3: Project Reorganization (Complete)
- [x] Create clean modular folder structure (`frontend/`, `backend/`, `docs/`, `skills/`).
- [x] Update Node paths to use `__dirname`.
- [x] Replicate fallback JSONs for client-failover static serving.
- [x] Write `demo-walkthrough.md`.
- [x] Populate repository documentation (`README.md`, `AGENTS.md`, `GEMINI.md`).
- [x] Research and lock in UX/design specifications in `docs/design/`.

### Phase 4: Hardware Sensor Prototyping
- [ ] Develop IoT microcontroller telemetry integration.
- [ ] Live sensor data ingestion endpoints.

### Phase 4: Full Multi-Agent Logistics Engine
- [ ] Orchestrate multi-truck fleet dispatching.
- [ ] Dynamic weather-aware re-routing in-transit.

### Phase 5: Production & Cloud Deployment
- [ ] Cloud hosting setup.
- [ ] Comprehensive E2E automated testing.
