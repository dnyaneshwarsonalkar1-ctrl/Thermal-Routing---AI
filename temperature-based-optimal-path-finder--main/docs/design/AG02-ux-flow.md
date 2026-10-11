# UX Flow & Resilience

## Primary User Flow
1. **Initialize**: Map centers on Davanagere GMU Hub. 
2. **Configure**: User selects Produce (e.g., Tomato), Departure Time, and Deadline.
3. **Trigger**: User clicks "Calculate Optimal Route".
4. **Execution**: Frontend calls `POST /api/optimize` on Port 5000.
5. **Display**: 
   - Camera flies to bounds of returned routes.
   - Polylines are drawn (colored by thermal risk).
   - "AI Recommended" card docks at the bottom.
6. **Interact**: 
   - User drags Heatwave Slider; client-side math recalculates instantly (zero latency).
   - User clicks "Start Dispatch Journey"; isometric truck animates along the polyline.

## API Error & Offline Handling
If the external APIs (OSRM, Open-Meteo) timeout, or the local Express backend goes offline:
- **Silent Failover**: The AbortController intercepts the failed `fetch()` after 3 seconds.
- **Client Fallback**: The app falls back to local pre-cached datasets (`fallback_routes.json`, `fallback_weather.json`).
- **Telemetry Indication**: A floating badge switches from a green "Express Backend" to an amber "Client-Side Fallback" to inform the user of the resilience layer activating.
