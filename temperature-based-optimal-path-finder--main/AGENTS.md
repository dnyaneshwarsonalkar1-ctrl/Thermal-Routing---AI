Read docs/PLAN.md and docs/DESIGN.md before making significant changes.
Read docs/design/*.md for frontend styling rules.

## Project Summary
AI26AG02 "Thermal Routing for Perishability Decay" (6-hour college hackathon project, GM University).

## Core Biophysical Model
- heat_factor = 2 ^ ((T - T_ref) / 10) [Q10 = 2]
- thermal_load = sum(hours_in_segment * heat_factor)
- quality_at_arrival = 100 * exp(-k * thermal_load)
- score = (0.20 * time) + (0.05 * distance) + (0.75 * (100 - quality)) + (deadlineBreached ? 500 : 0)
- Reference values: 
  * Leafy greens (T_ref 10°C, k 0.35)
  * Tomato (T_ref 13°C, k 0.20)
  * Mango (T_ref 13°C, k 0.15)
  * Potato/Onion (T_ref 15°C, k 0.06)

## API Rules & Safeguards
- OSRM public demo server: 1 req/sec max, fallback to `fallback_routes.json`.
- Open-Meteo: Batched comma-separated lat/lon queries in a single request, fallback to `fallback_weather.json`.

## Architecture & Offline Failover
Node.js Express backend on port 5000 with automatic in-browser client fallback in `frontend/js/app.js` if the backend is unreachable. Zero API calls on slider interactions.

## What NOT to build
No databases, no user accounts, no heavy ML neural nets, no raw Three.js canvas.

## Definition of Done
- Code is resilient (abides by offline fallback strategies).
- No blocking or synchronous sleep loops in the browser UI thread.
- Adheres to the established architecture constraints.
