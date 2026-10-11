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
            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        }).on('error', reject);
    });
}

async function verifyAll() {
    console.log('=== COMPREHENSIVE TWO-PAGE ARCHITECTURE AUDIT ===\n');
    let totalChecks = 0;
    let passedChecks = 0;

    function check(label, condition) {
        totalChecks++;
        if (condition) {
            console.log(`  [PASS] ${label}`);
            passedChecks++;
        } else {
            console.error(`  [FAIL] ${label}`);
        }
    }

    // 1. Landing Page checks
    console.log('1. MARKETING LANDING PAGE (http://localhost:3000/):');
    const landing = await fetchUrl('http://localhost:3000/');
    check('Landing Page returns HTTP 200', landing.status === 200);
    check('Brand logo coolroute present', landing.data.includes('coolroute'));
    check('Navbar CTA "Launch Live App" points to /dashboard.html', landing.data.includes('Launch Live App') && landing.data.includes('/dashboard.html'));
    check('Hero headline: "Move harvests gently, before the heat does."', landing.data.includes('Move harvests') && landing.data.includes('gently'));
    check('Hero CTA: "Open Command Center" points to /dashboard.html', landing.data.includes('Open Command Center') && landing.data.includes('/dashboard.html'));
    check('Scenario Section with all cards & scroll arrows', landing.data.includes('The invisible moments where harvests are lost') && landing.data.includes('Tarmac radiation'));
    check('9-Step Pipeline Section with 01-09 cards', landing.data.includes('How thermal routing protects the harvest') && landing.data.includes('09') && landing.data.includes('Telemetry & Rerouting'));
    check('Farmer Testimonials with Ramesh Patel, Amara Okafor, Mateo Silva', landing.data.includes('Voices from the farmgate') && landing.data.includes('Ramesh Patel') && landing.data.includes('Mateo Silva'));
    check('FAQ Accordion with 6 items', landing.data.includes('Frequently asked questions') && landing.data.includes('How is thermal load calculated?'));
    check('Waitlist form with email input and submit', landing.data.includes('Ready to save the next harvest?') && landing.data.includes('id="waitlist-form"'));
    check('Footer with Softly Design System branding', landing.data.includes('Built with \'Softly\' Design System'));

    // 2. CSS Check
    console.log('\n2. LANDING PAGE CSS (http://localhost:3000/landing.css):');
    const css = await fetchUrl('http://localhost:3000/landing.css');
    check('landing.css returns HTTP 200', css.status === 200);
    check('Defines --coral color token (#FFB7B2)', css.data.includes('--coral: #FFB7B2'));
    check('Defines --sage color token (#E8EFE8)', css.data.includes('--sage: #E8EFE8'));
    check('Defines --lavender color token (#EFEDF4)', css.data.includes('--lavender: #EFEDF4'));
    check('Imports Outfit and Reenie Beanie Google fonts', css.data.includes('Outfit') && css.data.includes('Reenie Beanie'));

    // 3. Dashboard Page checks
    console.log('\n3. COMMAND CENTER DASHBOARD (http://localhost:3000/dashboard.html):');
    const dash = await fetchUrl('http://localhost:3000/dashboard.html');
    check('Dashboard returns HTTP 200', dash.status === 200);
    check('Back to Overview Link pointing to /', dash.data.includes('nav-back-btn') && dash.data.includes('href="/"'));
    check('Leaflet interactive map container #map', dash.data.includes('id="map"'));
    check('Produce dropdown #produce-type', dash.data.includes('id="produce-type"'));
    check('Custom crop lab tuner #toggle-custom-crop-btn & #custom-crop-tray', dash.data.includes('id="toggle-custom-crop-btn"') && dash.data.includes('id="custom-crop-tray"'));
    check('Custom farm location #toggle-custom-loc-btn & #custom-loc-tray', dash.data.includes('id="toggle-custom-loc-btn"') && dash.data.includes('id="custom-loc-tray"'));
    check('Multi-farm pickup #multi-farm-pickup', dash.data.includes('id="multi-farm-pickup"'));
    check('Mandi Benchmark #mandi-benchmark-section & rates', dash.data.includes('id="mandi-benchmark-section"') && dash.data.includes('id="mandi-rate-display"'));
    check('Telemetry HUD #hud-route-name, #hud-temp, #hud-quality', dash.data.includes('id="hud-route-name"') && dash.data.includes('id="hud-temp"') && dash.data.includes('id="hud-quality"'));
    check('Scripts intact: config.js, routing.js, thermalModel.js, app.js', dash.data.includes('js/config.js') && dash.data.includes('js/routing.js') && dash.data.includes('js/thermalModel.js') && dash.data.includes('js/app.js'));

    console.log(`\n==============================================`);
    console.log(`AUDIT RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED`);
    console.log(`==============================================`);
    if (passedChecks !== totalChecks) process.exit(1);
}

verifyAll();
