# DESIGN.md - Thermal Route Logistics

## 1. Design Vision
**"Snap Map for Agricultural Cold-Chains"**
A playful yet high-utility technical logistics visualization that balances robust enterprise telemetry with consumer-grade spatial awareness. 

## 2. Spatial & Perspective Specs
- **Camera Pitch:** 45° to 60° tilted isometric view.
- **Map Style:** Clean carto-slate basemap with elevated landmarks (farms as floating farm beacons, plant as central silo hub).
- **Marker Mechanics:** 3D floating pill tags with subtle hover elevation and dynamic risk glow (Emerald `#10b981`, Amber `#f59e0b`, Crimson `#ef4444`).

## 3. Color System (Dark Tactical + Snap Vibrancy)
- **Canvas Base:** `#0b0f19` (Midnight Charcoal)
- **Surface Panels:** `#161f30` (Frosted Slate) with 12px backdrop blur
- **Accent Primary:** `#38bdf8` (Cyan Pulse)
- **Quality Safe:** `#22c55e` (Vibrant Green)
- **Quality Decay:** `#ef4444` (Thermal Red)
- **Route Polylines:** 4px glow stroke with directional pulse

## 4. Component Architecture
- **Header:** Minimal floating glass navigation bar ("THERMAL ROUTE").
- **Controls:** Compact floating drawer (Produce selector, departure time pill buttons, deadline slider).
- **Route Comparison:** Horizontally swipeable or stacked 3D floating glass cards displaying distance, time, and arrival quality.
- **Telemetry HUD:** Snap-style floating mini-widget tracking real-time transit temperature and cargo health.

## 5. Micro-Interactions & Animation
- **Route Selection:** Camera smoothly flies and tilts to frame the chosen corridor.
- **Heatwave Slider:** Real-time dynamic heat aura radiating outward from segment polylines.
- **Transit Simulation:** Isometric 3D truck token cruising along the spline with dynamic particle trail.

## 6. Fallback & Performance Guardrails
- **Performance:** Strict 60fps rendering budget.
- **Graceful Degradation:** Instant fallback to standard 2D view if WebGL pitch fails.
