# Live Demo Walkthrough & Pitch Guide

## 2-Minute Demo Flow
1. **Select Configuration**: Select "Tomato" crop and set Departure Time to 10:00 AM.
2. **Calculate**: Click "Calculate Optimal Route". Wait 1-2 seconds.
3. **Explain AI Recommendation**: Point out the "AI Recommended" route card. Highlight the Q10 computed arrival quality and how the shortest distance isn't always the safest.
4. **Stress Test**: Slowly move the Heatwave slider to +5°C.
5. **Real-time Re-ranking**: Show how route colors dynamically change from green to red without backend calls, thanks to client-side zero-latency math.
6. **Dispatch**: Click "Start Dispatch Journey".
7. **Telemetry HUD**: Show the vehicle telemetry HUD popping up and the cargo quality dropping dynamically as the truck traverses hot segments.

## 5-Minute Pitch Outline
- **Problem**: 30%+ of agricultural produce in emerging markets spoils during transit. Existing routing only considers distance and traffic, completely ignoring thermal exposure.
- **Core Insight**: "The shortest route is not always the safest route." If the shortest path goes through a barren, heat-exposed valley, the cargo will cook. We route for *shelf-life*.
- **Biophysical Math**: We employ a deterministic Q10 thermal degradation model. For every 10°C rise, the decay rate doubles. We pull segment-level hourly weather forecasts to predict precise arrival quality.
- **System Architecture**: Node.js microservice architecture with complete 100% offline client-side failover capability. Rural connectivity drops won't stop the logistics engine.
- **Smallholder Impact**: Connecting Davanagere (Hub) with Harihar, Honnali, and Jagalur farms minimizes waste, boosts farmer payouts, and stabilizes the supply chain.

## Judge Q&A Defense Card
- **Why Q10 instead of black-box ML?**
  * Determinism. Logistics companies need explainable decisions, not hallucinated risks. Q10 is a globally recognized biophysical standard that is computationally lightweight enough to run entirely in the browser.
- **Why not just take the shortest route?**
  * A route that is 10 minutes faster but 5°C hotter will exponentially decay sensitive crops like Leafy Greens.
- **What happens if the APIs go down?**
  * The system guarantees 100% uptime through dual-engine failover. If the Node.js backend or OSRM/Open-Meteo drop out, the frontend instantly fails over to cached offline JSON topologies and client-side decay calculation.
- **What is real vs. simulated?**
  * The routes (OSRM), the weather (Open-Meteo), and the Q10 math are real. The truck dispatch animation and the farm locations are simulated for demo clarity.
