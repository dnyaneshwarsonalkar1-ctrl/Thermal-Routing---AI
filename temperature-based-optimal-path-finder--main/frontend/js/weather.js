let weatherCache = null;
let lastWeatherQuery = null;

async function fetchFallbackWeather() {
    try {
        const response = await fetch('fallback_weather.json');
        return await response.json();
    } catch (e) {
        console.error("Failed to load fallback weather:", e);
        return [];
    }
}

function updateWeatherBadge(isOffline) {
    let badge = document.getElementById('weather-telemetry');
    if (badge) {
        badge.style.display = 'block';
        if (isOffline) {
            badge.textContent = 'Weather: Offline / Cached Fallback';
            badge.className = 'telemetry-badge offline';
        } else {
            badge.textContent = 'Weather: Online / Live Open-Meteo';
            badge.className = 'telemetry-badge online';
        }
    }
}

async function attachRouteTemperatures(routes, departureHour = 10) {
    if (!routes || routes.length === 0) return routes;

    // Extract 3 to 4 sample points per route
    const allCoords = [];
    routes.forEach(route => {
        const coords = route.geometry.coordinates;
        // Sample points: start, 1/3, 2/3, end
        const numPoints = Math.min(4, coords.length);
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const idx = Math.floor(i * (coords.length - 1) / (numPoints - 1));
            points.push(coords[idx]);
        }
        route.samplePoints = points; 
        
        points.forEach(pt => allCoords.push(pt));
    });

    // Sample up to 4-5 key corridor coordinates rounded to 4 decimals for high-speed Open-Meteo query
    const sampleSet = allCoords.length > 5 ? [allCoords[0], allCoords[Math.floor(allCoords.length / 3)], allCoords[Math.floor(2 * allCoords.length / 3)], allCoords[allCoords.length - 1]] : allCoords;
    const lats = sampleSet.map(c => Number(c[1]).toFixed(4)).join(',');
    const lons = sampleSet.map(c => Number(c[0]).toFixed(4)).join(',');
    
    // Simple caching mechanism based on coordinates and departure time
    const queryKey = `${lats}_${lons}`;
    
    let weatherData = null;
    
    if (weatherCache && (lastWeatherQuery === queryKey || weatherCache.length > 0)) {
        console.log("Using cached weather data for these coordinates.");
        weatherData = weatherCache;
        updateWeatherBadge(false);
    } else {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m&forecast_days=1`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Open-Meteo HTTP error: ${response.status}`);
            
            const data = await response.json();
            
            // Format check: Open-Meteo returns array of locations if multiple coordinates were queried
            if (Array.isArray(data)) {
                weatherData = data;
            } else if (data.hourly) {
                weatherData = [data]; // Single point response
            } else {
                throw new Error("Invalid weather data structure");
            }
            
            updateWeatherBadge(false);
            weatherCache = weatherData;
            lastWeatherQuery = queryKey;
        } catch (e) {
            console.warn("Weather API fetch failed, loading fallback_weather.json:", e.message);
            clearTimeout(timeoutId);
            updateWeatherBadge(true);
            weatherData = await fetchFallbackWeather();
        }
    }

    // Attach temperatures back to candidate routes
    let coordIndex = 0;
    
    routes.forEach(route => {
        const numPoints = route.samplePoints.length;
        const segmentTemps = [];
        
        // Distribute route duration across segments
        const hoursPerSegment = (route.duration / 3600) / (numPoints - 1 || 1);
        
        for (let i = 0; i < numPoints; i++) {
            // Use modulo for fallback array size mismatch safety
            const locData = Array.isArray(weatherData) && weatherData.length > 0 
                ? weatherData[coordIndex % weatherData.length] 
                : weatherData;
            
            let temp = 25.0; // Fail-safe default
            if (locData && locData.hourly && locData.hourly.temperature_2m) {
                const elapsedHours = i * hoursPerSegment;
                const timeIndex = Math.min(23, Math.floor(departureHour + elapsedHours));
                temp = locData.hourly.temperature_2m[timeIndex] ?? 25.0;
            }
            
            segmentTemps.push(temp);
            coordIndex++;
        }
        
        route.segmentTemps = segmentTemps;
        const sum = segmentTemps.reduce((a, b) => a + b, 0);
        route.avgTemp = Number((sum / segmentTemps.length).toFixed(1));
    });
    
    console.log("Attached temperatures to routes:", routes);
    return routes;
}
