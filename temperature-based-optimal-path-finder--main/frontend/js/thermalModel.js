function calculateThermalDecay(route, produceKey, deadlineHours, customConfig) {
    let produce = CONFIG.PRODUCE[produceKey];
    if (customConfig || produceKey === 'custom') {
        if (customConfig) {
            produce = {
                name: customConfig.name || 'Custom Crop',
                T_ref: customConfig.tRef !== undefined ? customConfig.tRef : (customConfig.T_ref !== undefined ? customConfig.T_ref : 12),
                k: customConfig.k !== undefined ? customConfig.k : 0.012,
                rate: customConfig.pricePerKg !== undefined ? customConfig.pricePerKg : (customConfig.rate !== undefined ? customConfig.rate : 40)
            };
        }
    }
    if (!produce) produce = CONFIG.PRODUCE.tomato;
    
    const T_ref = produce.T_ref;
    const k = produce.k;
    
    const routeDurationHours = route.duration / 3600;
    const routeDistanceKm = route.distance / 1000;
    
    const segmentCount = route.segmentTemps ? route.segmentTemps.length : 1;
    const hoursInSegment = routeDurationHours / segmentCount;
    
    let thermalLoad = 0;
    
    if (route.segmentTemps && route.segmentTemps.length > 0) {
        for (let i = 0; i < segmentCount; i++) {
            const segmentTemp = route.segmentTemps[i];
            const heatFactor = Math.pow(2, (segmentTemp - T_ref) / 10);
            thermalLoad += (hoursInSegment * heatFactor);
        }
    } else {
        // Fallback if no segment temps
        const heatFactor = Math.pow(2, (route.avgTemp - T_ref) / 10);
        thermalLoad = routeDurationHours * heatFactor;
    }
    
    let qualityAtArrival = 100 * Math.exp(-k * thermalLoad);
    qualityAtArrival = Math.max(0, Math.min(100, qualityAtArrival));
    
    let riskLevel;
    if (qualityAtArrival >= 80) riskLevel = 'Green';
    else if (qualityAtArrival >= 65) riskLevel = 'Amber';
    else riskLevel = 'Red';
    
    const isDeadlineBreached = routeDurationHours > deadlineHours;
    const penalty = isDeadlineBreached ? 500 : 0;
    
    const w1 = CONFIG.SCORING.w1;
    const w2 = CONFIG.SCORING.w2;
    const w3 = CONFIG.SCORING.w3;
    
    const qualityLoss = 100 - qualityAtArrival;
    const score = (w1 * routeDurationHours) + (w2 * routeDistanceKm) + (w3 * qualityLoss) + penalty;
    
    return {
        thermalLoad: Number(thermalLoad.toFixed(2)),
        qualityAtArrival: Number(qualityAtArrival.toFixed(1)),
        riskLevel,
        isDeadlineBreached,
        score: Number(score.toFixed(2)),
        durationHours: Number(routeDurationHours.toFixed(2)),
        distanceKm: Number(routeDistanceKm.toFixed(2))
    };
}

function generateRecommendationExplanation(rankedRoutes, produceName) {
    if (!rankedRoutes || rankedRoutes.length === 0) return "No routes available to analyze.";
    if (rankedRoutes.length === 1) return `${rankedRoutes[0].name} is the only viable route.`;

    const winningRoute = rankedRoutes[0];
    
    let fastestRoute = rankedRoutes[0];
    for (const route of rankedRoutes) {
        if (route.duration < fastestRoute.duration) {
            fastestRoute = route;
        }
    }

    if (winningRoute.id === fastestRoute.id || winningRoute.name === fastestRoute.name) {
        return `<strong>${winningRoute.name}</strong> is AI RECOMMENDED: It is the fastest route and preserves <strong>${winningRoute.thermal.qualityAtArrival}%</strong> quality for ${produceName}, offering the best baseline performance.`;
    }

    const distDiff = (winningRoute.distance / 1000) - (fastestRoute.distance / 1000);
    const timeDiffMins = (winningRoute.duration / 60) - (fastestRoute.duration / 60);
    
    const distText = distDiff > 0 ? `${distDiff.toFixed(1)} km longer` : `${Math.abs(distDiff).toFixed(1)} km shorter`;
    const timeText = timeDiffMins > 0 ? `+${timeDiffMins.toFixed(0)} mins` : `${timeDiffMins.toFixed(0)} mins`;

    return `<strong>${winningRoute.name}</strong> is AI RECOMMENDED: While it is ${distText} (${timeText}), it preserves <strong>${winningRoute.thermal.qualityAtArrival}%</strong> quality vs ${fastestRoute.thermal.qualityAtArrival}% on ${fastestRoute.name} by avoiding midday heat corridors, resulting in an optimal perishability-to-time trade-off.`;
}

// Export for browser
window.calculateThermalDecay = calculateThermalDecay;
window.generateRecommendationExplanation = generateRecommendationExplanation;
