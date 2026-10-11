# Map Interface Specifications

## Viewport Behavior
- **Hero Stance**: Full-screen `#map` div behind all UI controls. 
- **Dark Mode Tiles**: OpenStreetMap tiles with `filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);`.
- **Transitions**: Use Leaflet's `flyToBounds()` with `{ padding: [50, 50], duration: 1.5 }` for cinematic framing of new routes.

## Markers & Splines
- **Hub Marker**: Pulsing blue 3D pill.
- **Farm Markers**: Green elevated nodes.
- **Route Polylines**: 
  - Recommended Route: Thick (weight: 6), colored by `riskLevel` (Green/Amber/Red), with a glowing drop-shadow.
  - Alternate Routes: Thinner (weight: 4), dimmed opacity (0.5), colored grey or muted risk color.

## Animation Specs
- **Truck Spline Movement**: `L.Marker` updated via `requestAnimationFrame` interpolating across the Leaflet Polyline coordinates.
- **Bottom-Sheet Card**: Slides up from the bottom using CSS transitions (`transform: translateY(0)` vs `110%`).
