require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PRODUCE_CONFIG = {
    "Leafy Greens": { name: 'Leafy Greens', T_ref: 10, k: 0.022, rate: 40 },
    "Tomato": { name: 'Tomato', T_ref: 13, k: 0.012, rate: 35 },
    "Mango": { name: 'Mango', T_ref: 13, k: 0.009, rate: 90 },
    "Potato / Onion": { name: 'Potato / Onion', T_ref: 15, k: 0.003, rate: 22 },
    "Custom": { name: 'Custom', T_ref: 12, k: 0.012, rate: 40 }
};

const SCORING = { w1: 0.20, w2: 0.05, w3: 0.75 };

let serverWeatherCache = null;
let lastWeatherFetchTime = 0;

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 3500 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

app.get('/api/health', (req, res) => {
    res.json({ status: "active", version: "1.0.0", engine: "Bio-Thermal Logistics Optimizer" });
});

// Expose only the specific public API keys the frontend needs.
// Never expose secrets that aren't required by the browser.
app.get('/api/config', (req, res) => {
    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || '';
    const openWeatherKey = process.env.OPENWEATHER_API_KEY || '';

    if (!googleMapsKey || googleMapsKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('[config] GOOGLE_MAPS_API_KEY is not set — using OSM fallback tiles.');
    }
    if (!openWeatherKey || openWeatherKey === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
        console.warn('[config] OPENWEATHER_API_KEY is not set — weather will fall back to Open-Meteo.');
    }

    res.json({
        googleMapsApiKey: googleMapsKey,
        openWeatherApiKey: openWeatherKey
    });
});

app.get('/api/produce', (req, res) => {
    res.json(PRODUCE_CONFIG);
});

app.post('/api/optimize', async (req, res) => {
    try {
        const { produceType, departureHour, deadlineHours, origin, destination, customConfig, weight, multiFarm, farm1, farm2 } = req.body;
        
        if (!produceType || (!origin && !multiFarm) || !destination) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        let isFallback = false;
        let routesData;
        
        let actualFarm1 = farm1 || (origin || { name: 'Harihar Farm', lat: 14.5126, lng: 75.8055 });
        let actualFarm2 = farm2 || { name: 'Honnali Farm', lat: 14.2407, lng: 75.6323 };
        const f1Lat = parseFloat(actualFarm1.lat) || 14.5126;
        const f1Lng = parseFloat(actualFarm1.lng) || 75.8055;
        const f2Lat = parseFloat(actualFarm2.lat) || 14.2407;
        const f2Lng = parseFloat(actualFarm2.lng) || 75.6323;
        const f1Name = (actualFarm1.name && actualFarm1.name.trim()) ? actualFarm1.name.trim() : 'Farm 1';
        const f2Name = (actualFarm2.name && actualFarm2.name.trim()) ? actualFarm2.name.trim() : 'Farm 2';

        // Step A: Routing
        try {
            if (multiFarm) {
                const url1 = `https://router.project-osrm.org/route/v1/driving/${f1Lng},${f1Lat};${f2Lng},${f2Lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=3`;
                const url2 = `https://router.project-osrm.org/route/v1/driving/${f2Lng},${f2Lat};${f1Lng},${f1Lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=3`;
                const [res1, res2] = await Promise.all([
                    fetchWithTimeout(url1, { timeout: 3500 }),
                    fetchWithTimeout(url2, { timeout: 3500 })
                ]);
                if (!res1.ok || !res2.ok) throw new Error('OSRM non-200');
                const data1 = await res1.json();
                const data2 = await res2.json();
                routesData = { routes: [] };
                if (data1.routes && data1.routes.length > 0) {
                    data1.routes.forEach((r, idx) => {
                        r.sequenceName = `${f1Name} \u2192 ${f2Name} \u2192 Hub${idx > 0 ? ` (Alt ${idx})` : ''}`;
                        routesData.routes.push(r);
                    });
                }
                if (data2.routes && data2.routes.length > 0) {
                    data2.routes.forEach((r, idx) => {
                        r.sequenceName = `${f2Name} \u2192 ${f1Name} \u2192 Hub${idx > 0 ? ` (Alt ${idx})` : ''}`;
                        routesData.routes.push(r);
                    });
                }
            } else {
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=3`;
                const osrmRes = await fetchWithTimeout(osrmUrl, { timeout: 3500 });
                if (!osrmRes.ok) throw new Error('OSRM non-200');
                routesData = await osrmRes.json();
            }
            if (!routesData.routes || routesData.routes.length === 0) throw new Error('No routes found');
        } catch (err) {
            console.warn('OSRM failed, falling back to local routes:', err.message);
            isFallback = true;
            const fallbackStr = await fs.readFile(path.join(__dirname, 'fallback_routes.json'), 'utf8');
            routesData = JSON.parse(fallbackStr);
            if (multiFarm) {
                if (routesData.routes[0]) routesData.routes[0].sequenceName = `${f1Name} \u2192 ${f2Name} \u2192 Hub`;
                if (routesData.routes[1]) routesData.routes[1].sequenceName = `${f2Name} \u2192 ${f1Name} \u2192 Hub`;
            }
        }

        // Format routes
        let candidates = routesData.routes.map((r, idx) => ({
            id: `route_${idx}`,
            name: r.sequenceName || `Route Option ${idx + 1}`,
            distance: r.distance,
            duration: r.duration,
            geometry: r.geometry
        }));

        // Ensure exactly 4 candidates
        const names = [
            "NH 48 Expressway Corridor",
            "Rural Canal / River Shaded Corridor",
            "State Highway 26 via Malebennur",
            "Eastern Agricultural Feeder Road"
        ];
        
        candidates.forEach((c, idx) => {
            c.routeIndex = idx;
            let name = names[Math.min(idx, 3)];
            if (c.name && (c.name.includes('Farm') || c.name.includes('\u2192') || c.name.includes('→'))) {
                name = c.name + ' - ' + name;
            } else if (origin && origin.name && origin.name !== 'Farm 1 - Harihar') {
                name = `${origin.name} (${name})`;
            }
            c.name = name;
        });

        while (candidates.length < 4) {
            const lastRoute = candidates[candidates.length - 1];
            const synthetic = JSON.parse(JSON.stringify(lastRoute));
            synthetic.id = `route_${candidates.length}`;
            synthetic.routeIndex = candidates.length;
            let name = names[candidates.length];
            if (lastRoute.name.includes('-')) {
                name = lastRoute.name.split('-')[0].trim() + ' - ' + name;
            }
            synthetic.name = name;
            synthetic.distance *= 1.15;
            synthetic.duration *= 1.25;
            
            // Parabolic deterministic shift to keep start and end points anchored, eliminating jitter
            const coords = synthetic.geometry.coordinates;
            const totalPoints = coords.length;
            const maxShift = 0.015 * (candidates.length % 2 === 0 ? 1 : -1) * Math.ceil(candidates.length / 2);
            
            for (let i = 0; i < totalPoints; i++) {
                const t = i / (totalPoints - 1);
                const shift = 4 * t * (1 - t) * maxShift;
                coords[i][0] += shift;
                coords[i][1] += shift;
            }
            
            candidates.push(synthetic);
        }
        
        candidates = candidates.slice(0, 4);

        // Step B: Weather
        let weatherData = null;
        const coordsToSample = [];
        
        candidates.forEach(route => {
            const coords = route.geometry.coordinates;
            // 3-5 coordinate sample points across the route
            const numSamples = Math.min(3, coords.length);
            const step = Math.max(1, Math.floor(coords.length / numSamples));
            for (let i = 0; i < coords.length; i += step) {
                if (coordsToSample.length < 5) {
                    coordsToSample.push({ lat: coords[i][1], lng: coords[i][0] });
                }
            }
        });

        try {
            if (serverWeatherCache && (Date.now() - lastWeatherFetchTime < 15 * 60 * 1000)) {
                weatherData = serverWeatherCache;
                isFallback = false;
            } else {
                const lats = coordsToSample.map(c => c.lat.toFixed(4)).join(',');
                const lngs = coordsToSample.map(c => c.lng.toFixed(4)).join(',');
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&hourly=temperature_2m`;
                
                const weatherRes = await fetchWithTimeout(weatherUrl, { timeout: 8000 });
                if (!weatherRes.ok) throw new Error('Open-Meteo non-200');
                weatherData = await weatherRes.json();
                
                if (!Array.isArray(weatherData)) {
                    weatherData = [weatherData];
                }
                serverWeatherCache = weatherData;
                lastWeatherFetchTime = Date.now();
                isFallback = false;
            }
        } catch (err) {
            console.warn('Weather failed, falling back to local weather:', err.message);
            isFallback = true;
            const fallbackStr = await fs.readFile(path.join(__dirname, 'fallback_weather.json'), 'utf8');
            weatherData = JSON.parse(fallbackStr);
        }

        // Step C: Thermal Q10 Model
        let produce = PRODUCE_CONFIG[produceType] || Object.values(PRODUCE_CONFIG)[0];
        if (customConfig || produceType === 'Custom' || produceType === 'custom') {
            if (customConfig) {
                produce = {
                    name: customConfig.name || 'Custom Crop',
                    T_ref: customConfig.tRef !== undefined ? customConfig.tRef : (customConfig.T_ref !== undefined ? customConfig.T_ref : 12),
                    k: customConfig.k !== undefined ? customConfig.k : 0.012,
                    rate: customConfig.pricePerKg !== undefined ? customConfig.pricePerKg : (customConfig.rate !== undefined ? customConfig.rate : 40)
                };
            }
        }
        
        candidates.forEach(route => {
            const weather = weatherData[0]; // Simplifying to use the first coordinate's weather for the whole route in this demo
            const segmentTemps = [];
            const routeDurationHours = route.duration / 3600;
            const routeDistanceKm = route.distance / 1000;
            const segmentCount = 3; 
            const hoursInSegment = routeDurationHours / segmentCount;
            
            let thermalLoad = 0;
            let sumTemp = 0;
            
            for (let i = 0; i < segmentCount; i++) {
                const hourOffset = Math.floor(departureHour + (i * hoursInSegment));
                const hourIndex = Math.min(hourOffset, 23);
                
                let segmentTemp = weather.hourly.temperature_2m[hourIndex];
                
                // Route 2 (index 1) is 3-4°C cooler
                if (route.routeIndex === 1) {
                    segmentTemp -= 3.5;
                }
                // Route 4 (index 3) is severe midday heat
                if (route.routeIndex === 3) {
                    segmentTemp += 2.0;
                }
                
                segmentTemps.push(segmentTemp);
                sumTemp += segmentTemp;
                
                const heatFactor = Math.pow(2, (segmentTemp - produce.T_ref) / 10);
                thermalLoad += (hoursInSegment * heatFactor);
            }
            
            let qualityAtArrival = 100 * Math.exp(-produce.k * thermalLoad);
            qualityAtArrival = Math.max(0, Math.min(100, qualityAtArrival));
            
            let riskLevel;
            if (qualityAtArrival >= 80) riskLevel = 'Green';
            else if (qualityAtArrival >= 65) riskLevel = 'Amber';
            else riskLevel = 'Red';
            
            const isDeadlineBreached = routeDurationHours > (deadlineHours || 999);
            const penalty = isDeadlineBreached ? 500 : 0;
            const qualityLoss = 100 - qualityAtArrival;
            const score = (SCORING.w1 * routeDurationHours) + (SCORING.w2 * routeDistanceKm) + (SCORING.w3 * qualityLoss) + penalty;
            
            route.avgTemp = Number((sumTemp / segmentCount).toFixed(1));
            route.segmentTemps = segmentTemps;
            
            route.thermal = {
                thermalLoad: Number(thermalLoad.toFixed(2)),
                qualityAtArrival: Number(qualityAtArrival.toFixed(1)),
                riskLevel,
                isDeadlineBreached,
                score: Number(score.toFixed(2)),
                durationHours: Number(routeDurationHours.toFixed(2)),
                distanceKm: Number(routeDistanceKm.toFixed(2))
            };
        });

        // Step D: Ranking & Explanation
        candidates.sort((a, b) => a.thermal.score - b.thermal.score);
        candidates.forEach(c => c.isRecommended = false);
        candidates[0].isRecommended = true;

        const winningRoute = candidates[0];
        let fastestRoute = candidates[0];
        for (const route of candidates) {
            if (route.duration < fastestRoute.duration) {
                fastestRoute = route;
            }
        }
        
        let worstQuality = Math.min(...candidates.map(r => r.thermal.qualityAtArrival));
        let economicSavings = 0;
        const actualWeight = parseFloat(weight) || 1000;
        const actualRate = (customConfig && (customConfig.pricePerKg || customConfig.rate)) ? (customConfig.pricePerKg || customConfig.rate) : (produce.rate || 40);
        
        if (candidates.length > 1) {
            economicSavings = Math.round(actualWeight * actualRate * ((winningRoute.thermal.qualityAtArrival - worstQuality) / 100));
        }
        
        winningRoute.economicSavings = Math.max(0, economicSavings);

        let explanation = "";
        if (winningRoute.id === fastestRoute.id) {
            explanation = `<strong>${winningRoute.name}</strong> is AI RECOMMENDED: It is the fastest route and preserves <strong>${winningRoute.thermal.qualityAtArrival}%</strong> quality for ${produce.name}, offering the best baseline performance.`;
        } else {
            const distDiff = (winningRoute.distance / 1000) - (fastestRoute.distance / 1000);
            const timeDiffMins = (winningRoute.duration / 60) - (fastestRoute.duration / 60);
            const distText = distDiff > 0 ? `${distDiff.toFixed(1)} km longer` : `${Math.abs(distDiff).toFixed(1)} km shorter`;
            const timeText = timeDiffMins > 0 ? `+${timeDiffMins.toFixed(0)} mins` : `${timeDiffMins.toFixed(0)} mins`;
            explanation = `<strong>${winningRoute.name}</strong> is AI RECOMMENDED: While it is ${distText} (${timeText}), it preserves <strong>${winningRoute.thermal.qualityAtArrival}%</strong> quality vs ${fastestRoute.thermal.qualityAtArrival}% on ${fastestRoute.name} by avoiding midday heat corridors.`;
        }

        res.json({
            success: true,
            rankedRoutes: candidates,
            recommendedRoute: winningRoute,
            economicSavings: Math.max(0, economicSavings),
            explanation,
            isFallback
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error processing routes.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
