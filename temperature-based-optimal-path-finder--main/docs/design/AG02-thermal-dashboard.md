# Thermal Dashboard & Data Hierarchy

## Q10 Spoilage Model (Demo Approximations)
- **Leafy Greens**: 10°C T_ref, 0.35 k
- **Tomato**: 13°C T_ref, 0.20 k
- **Mango**: 13°C T_ref, 0.15 k
- **Potato / Onion**: 15°C T_ref, 0.06 k

*(Note: These are tunable approximations for the simulation, not laboratory-certified measurements).*

## Visual Hierarchy
1. **Primary Metric (The Hook)**: Arrival Quality (%) - Needs to be massive and colored by risk.
2. **Explainability**: Plain English string from the backend (e.g., "15 km longer, but significantly cooler.").
3. **Secondary Metrics**: Distance (km), Duration (hrs), Avg Temp (°C).
4. **Deadline Warning**: If the SLA is breached, display a flashing red banner.

## Heatwave Stress Test
- Real-time `input type="range"` (+0°C to +8°C).
- Modifies the cached `segmentTemps` in memory.
- Triggers immediate re-evaluation of Q10 decay and dynamically shifts polyline colors and quality scores without hitting the network.
