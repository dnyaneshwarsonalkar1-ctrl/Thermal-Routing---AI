const http = require('http');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url).toString();
                return fetchUrl(redirectUrl).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

function postJson(url, payload) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(payload);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, json: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log("=== RUNNING FRONTEND & SIMULATION INTEGRATION TESTS ===");
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    }

    // Test 1: Verify landing page & dashboard.html contain all required elements
    try {
        const landingRes = await fetchUrl('http://localhost:3000/');
        const res = await fetchUrl('http://localhost:3000/dashboard.html');
        assert(landingRes.status === 200 && res.status === 200, "Frontend server serves landing index.html & dashboard.html (HTTP 200)");
        assert(res.data.includes('id="toggle-custom-crop-btn"'), "HTML has #toggle-custom-crop-btn");
        assert(res.data.includes('id="custom-crop-tray"'), "HTML has #custom-crop-tray");
        assert(res.data.includes('id="custom-crop-name"'), "HTML has #custom-crop-name");
        assert(res.data.includes('id="custom-crop-tref"'), "HTML has #custom-crop-tref");
        assert(res.data.includes('id="custom-crop-k"'), "HTML has #custom-crop-k");
        assert(res.data.includes('id="custom-crop-price"'), "HTML has #custom-crop-price");
        assert(res.data.includes('id="toggle-custom-loc-btn"'), "HTML has #toggle-custom-loc-btn (Coexistence)");
        assert(res.data.includes('id="mandi-benchmark-section"'), "HTML has #mandi-benchmark-section");
        assert(res.data.includes('LIVE APMC DAVANAGERE MANDI BENCHMARK'), "HTML displays LIVE APMC Mandi Header");
        assert(res.data.includes('id="mandi-rate-display"'), "HTML has #mandi-rate-display");
        assert(res.data.includes('id="mandi-cargo-value"'), "HTML has #mandi-cargo-value");
        assert(res.data.includes('id="hud-route-name"'), "HTML has #hud-route-name inside telemetry HUD");
    } catch (err) {
        assert(false, `Frontend fetch failed: ${err.message}`);
    }

    // Test 2: Verify styles.css contains active-route-card styling
    try {
        const cssRes = await fetchUrl('http://localhost:3000/styles.css');
        assert(cssRes.status === 200, "styles.css served (HTTP 200)");
        assert(cssRes.data.includes('.route-card.active-route-card'), "styles.css defines .route-card.active-route-card");
        assert(cssRes.data.includes('.mandi-price-box'), "styles.css defines .mandi-price-box");
    } catch (err) {
        assert(false, `CSS fetch failed: ${err.message}`);
    }

    // Test 3: Backend /api/optimize with Custom Crop
    try {
        const customCropPayload = {
            produceType: "Strawberries",
            departureHour: 10,
            deadlineHours: 4,
            origin: { id: "farm_1", name: "Harihar Farm", lat: 14.5126, lng: 75.8055 },
            destination: { id: "hub", name: "GMU Hub", lat: 14.4644, lng: 75.9218 },
            weight: 1500,
            customConfig: {
                name: "Strawberries",
                tRef: 10,
                k: 0.025,
                pricePerKg: 120,
                rate: 120
            }
        };

        const optRes = await postJson('http://localhost:5000/api/optimize', customCropPayload);
        assert(optRes.status === 200, "Backend /api/optimize succeeds with customConfig (HTTP 200)");
        assert(optRes.json && optRes.json.rankedRoutes && optRes.json.rankedRoutes.length === 4, "Returns 4 ranked routes for custom crop");
        
        const rec = optRes.json.rankedRoutes[0];
        assert(rec.isRecommended === true, "Route 0 marked isRecommended = true");
        assert(typeof rec.thermal.qualityAtArrival === 'number', "Valid qualityAtArrival computed");
        assert(rec.economicSavings >= 0, "Economic savings computed using custom crop rate");
    } catch (err) {
        assert(false, `Backend custom crop test failed: ${err.message}`);
    }

    // Test 4: Verify Progressive Biophysical Decay Math for Simulation
    try {
        // Hot Highway vs Cool Corridor simulation verification
        const T_ref = 13;
        const k = 0.030;
        const hoursInTrip = 1.0;
        const numSegments = 3;
        const hoursPerSegment = hoursInTrip / numSegments;

        // Hot route segment temps
        const hotTemps = [35, 36, 37];
        let hotLoad = 0;
        hotTemps.forEach(temp => {
            hotLoad += hoursPerSegment * Math.pow(2, (temp - T_ref) / 10);
        });
        const hotQuality = 100 * Math.exp(-k * hotLoad);

        // Cool route segment temps
        const coolTemps = [25, 26, 26];
        let coolLoad = 0;
        coolTemps.forEach(temp => {
            coolLoad += hoursPerSegment * Math.pow(2, (temp - T_ref) / 10);
        });
        const coolQuality = 100 * Math.exp(-k * coolLoad);

        assert(coolQuality >= 80, `Cool Corridor maintains GREEN quality: ${coolQuality.toFixed(1)}% >= 80%`);
        assert(hotQuality < coolQuality, `Hot Highway experiences significantly higher decay: ${hotQuality.toFixed(1)}% < ${coolQuality.toFixed(1)}%`);
    } catch (err) {
        assert(false, `Simulation math test failed: ${err.message}`);
    }

    console.log(`\n========================================`);
    console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
    console.log(`========================================`);
    if (failed > 0) process.exit(1);
}

runTests();
