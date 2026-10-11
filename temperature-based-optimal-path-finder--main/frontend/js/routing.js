let lastRouteCallTime = 0;

async function fetchFallbackRoutes() {
    try {
        const response = await fetch('fallback_routes.json');
        const data = await response.json();
        return data.routes;
    } catch (e) {
        console.error("Failed to load fallback routes:", e);
        return [];
    }
}

function generateSyntheticRoute(baseRoute) {
    // Generate a synthetic variation of the base route
    const synthetic = JSON.parse(JSON.stringify(baseRoute));
    synthetic.name = "Route B (Alternative Corridor)";
    
    // Shift the middle coordinates slightly to create a synthetic alternative
    if (synthetic.geometry && synthetic.geometry.coordinates) {
        const coords = synthetic.geometry.coordinates;
        const middleIndex = Math.floor(coords.length / 2);
        const shiftAmt = 0.015; // Roughly a slight deviation (approx 1.5km)
        
        // Modify points in the middle 30% of the route
        const shiftStart = Math.floor(coords.length * 0.35);
        const shiftEnd = Math.floor(coords.length * 0.65);
        
        for (let i = Math.max(1, shiftStart); i < Math.min(coords.length - 1, shiftEnd); i++) {
            coords[i][0] += shiftAmt; // modify longitude
            coords[i][1] += shiftAmt; // modify latitude
        }
    }
    
    synthetic.distance = baseRoute.distance * 1.15;
    synthetic.duration = baseRoute.duration * 1.20;
    
    return synthetic;
}

function generateFourRoutes(routes) {
    const names = [
        "NH 48 Expressway Corridor",
        "Rural Canal / River Shaded Corridor",
        "State Highway 26 via Malebennur",
        "Eastern Agricultural Feeder Road"
    ];
    
    let generated = routes.map((r, idx) => {
        let name = names[Math.min(idx, 3)];
        if (r.name && (r.name.includes('Farm') || r.name.includes('\u2192') || r.name.includes('→'))) {
            name = r.name + ' - ' + name;
        }
        return {
            name: name,
            distance: r.distance,
            duration: r.duration,
            geometry: r.geometry,
            routeIndex: idx
        };
    });
    
    while (generated.length < 4) {
        const lastRoute = generated[generated.length - 1];
        const synthetic = JSON.parse(JSON.stringify(lastRoute));
        synthetic.routeIndex = generated.length;
        let name = names[generated.length];
        if (lastRoute.name.includes('-')) {
            name = lastRoute.name.split('-')[0].trim() + ' - ' + name;
        }
        synthetic.name = name;
        synthetic.distance *= 1.15;
        synthetic.duration *= 1.25;
        
        // Parabolic deterministic shift to keep start and end points anchored, eliminating jitter
        const coords = synthetic.geometry.coordinates;
        const totalPoints = coords.length;
        const maxShift = 0.015 * (generated.length % 2 === 0 ? 1 : -1) * Math.ceil(generated.length / 2);
        
        for (let i = 0; i < totalPoints; i++) {
            const t = i / (totalPoints - 1);
            const shift = 4 * t * (1 - t) * maxShift;
            coords[i][0] += shift;
            coords[i][1] += shift;
        }
        
        generated.push(synthetic);
    }
    
    return generated.slice(0, 4);
}

function updateTelemetryBadge(isOffline) {
    const badge = document.getElementById('telemetry-status');
    if (badge) {
        if (isOffline) {
            badge.textContent = 'Telemetry: Offline / Cached Fallback';
            badge.className = 'telemetry-badge offline';
        } else {
            badge.textContent = 'Telemetry: Online / Live OSRM';
            badge.className = 'telemetry-badge online';
        }
    }
}

async function getRouteAlternatives(originCoords, destCoords) {
    const now = Date.now();
    if (now - lastRouteCallTime < 1000) {
        console.warn("Routing cooldown active. Please wait 1 second.");
        return null; // Enforce cooldown
    }
    lastRouteCallTime = now;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&alternatives=3`;
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`OSRM HTTP error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error("No routes found from OSRM");
        }

        updateTelemetryBadge(false);

        return generateFourRoutes(data.routes);
    } catch (error) {
        console.warn("Routing network failure/timeout. Loading fallback routes.", error.message);
        updateTelemetryBadge(true);
        const fallback = await fetchFallbackRoutes();
        return generateFourRoutes(fallback);
    } finally {
        clearTimeout(timeoutId); // Ensure timeout is always cleared
    }
}

async function getMultiFarmRoutes(farm1, farm2, destCoords) {
    const now = Date.now();
    if (now - lastRouteCallTime < 1000) {
        console.warn("Routing cooldown active. Please wait 1 second.");
        return null;
    }
    lastRouteCallTime = now;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const f1Name = (farm1 && farm1.name && farm1.name.trim()) ? farm1.name.trim() : 'Farm 1';
    const f2Name = (farm2 && farm2.name && farm2.name.trim()) ? farm2.name.trim() : 'Farm 2';

    try {
        const url1 = `https://router.project-osrm.org/route/v1/driving/${farm1.lng},${farm1.lat};${farm2.lng},${farm2.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&alternatives=3`;
        const url2 = `https://router.project-osrm.org/route/v1/driving/${farm2.lng},${farm2.lat};${farm1.lng},${farm1.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&alternatives=3`;
        
        const [res1, res2] = await Promise.all([
            fetch(url1, { signal: controller.signal }),
            fetch(url2, { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);

        if (!res1.ok || !res2.ok) {
            throw new Error("OSRM HTTP error in multi-farm route");
        }

        const data1 = await res1.json();
        const data2 = await res2.json();

        let combined = [];
        if (data1.routes && data1.routes.length > 0) {
            data1.routes.forEach((r, idx) => {
                r.name = `${f1Name} \u2192 ${f2Name} \u2192 Hub${idx > 0 ? ` (Alt ${idx})` : ''}`;
                combined.push(r);
            });
        }
        if (data2.routes && data2.routes.length > 0) {
            data2.routes.forEach((r, idx) => {
                r.name = `${f2Name} \u2192 ${f1Name} \u2192 Hub${idx > 0 ? ` (Alt ${idx})` : ''}`;
                combined.push(r);
            });
        }

        if (combined.length === 0) {
            throw new Error("No multi-farm routes returned");
        }

        updateTelemetryBadge(false);
        return generateFourRoutes(combined);
    } catch (error) {
        console.warn("Multi-farm OSRM failure, falling back to local routes:", error.message);
        updateTelemetryBadge(true);
        const fallback = await fetchFallbackRoutes();
        if (fallback[0]) fallback[0].name = `${f1Name} \u2192 ${f2Name} \u2192 Hub`;
        if (fallback[1]) fallback[1].name = `${f2Name} \u2192 ${f1Name} \u2192 Hub`;
        return generateFourRoutes(fallback);
    } finally {
        clearTimeout(timeoutId);
    }
}
