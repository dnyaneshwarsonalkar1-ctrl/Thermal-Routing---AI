async function runTests() {
    console.log("Starting backend automated tests...\n");
    let passed = 0;
    const total = 5;
    const errors = [];
    
    function report(name, isPass, errorMsg = "") {
        if (isPass) {
            console.log(`[PASS] ${name}`);
            passed++;
        } else {
            console.log(`[FAIL] ${name}`);
            errors.push(`${name}: ${errorMsg}`);
        }
    }

    const API = "http://localhost:5000/api";
    const baseRequest = {
        origin: { lat: 14.4644, lng: 75.9218 },
        destination: { lat: 14.3941, lng: 75.9329 }
    };

    try {
        const res = await fetch(`${API}/health`);
        const data = await res.json();
        report("Test A: GET /api/health", data.status === "active", "Invalid health response");
    } catch (e) {
        report("Test A: GET /api/health", false, e.message);
    }

    try {
        const res = await fetch(`${API}/produce`);
        const data = await res.json();
        const hasAll = ["Leafy Greens", "Tomato", "Mango", "Potato / Onion"].every(k => data[k]);
        report("Test B: GET /api/produce", hasAll, "Missing produce configs");
    } catch (e) {
        report("Test B: GET /api/produce", false, e.message);
    }

    try {
        const res = await fetch(`${API}/optimize`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ produceType: "Tomato", departureHour: 10, deadlineHours: 4, ...baseRequest })
        });
        const data = await res.json();
        const ok = data.success && data.recommendedRoute.thermal.qualityAtArrival > 50; 
        report("Test C: POST /api/optimize (Tomato baseline)", ok, "Optimization failed or quality incorrect");
    } catch (e) {
        report("Test C: POST /api/optimize (Tomato baseline)", false, e.message);
    }

    try {
        const res = await fetch(`${API}/optimize`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ produceType: "Leafy Greens", departureHour: 14, deadlineHours: 4, ...baseRequest })
        });
        const data = await res.json();
        const ok = data.success && data.recommendedRoute.thermal.qualityAtArrival > 0;
        report("Test D: POST /api/optimize (Leafy greens high decay)", ok, "Leafy greens test failed");
    } catch (e) {
        report("Test D: POST /api/optimize (Leafy greens high decay)", false, e.message);
    }

    try {
        const res = await fetch(`${API}/optimize`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ produceType: "Tomato", departureHour: 10, deadlineHours: 0.1, ...baseRequest })
        });
        const data = await res.json();
        const breached = data.recommendedRoute.thermal.isDeadlineBreached === true && data.recommendedRoute.thermal.score > 500;
        report("Test E: POST /api/optimize (0.1 hr deadline penalty)", breached, "Deadline penalty not applied");
    } catch (e) {
        report("Test E: POST /api/optimize (0.1 hr deadline penalty)", false, e.message);
    }

    console.log("\n==============================");
    if (passed === total) {
        console.log(`ALL BACKEND TESTS PASSED (${passed}/${total})`);
    } else {
        console.log(`TESTS FAILED (${passed}/${total} passed)`);
        console.error(errors);
    }
}

runTests();
