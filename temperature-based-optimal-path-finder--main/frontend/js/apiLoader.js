/**
 * apiLoader.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches API keys from the backend /api/config endpoint,
 * stores them in window.APP_CONFIG, dynamically loads the
 * Google Maps JavaScript API (if a key is present), then
 * loads app.js to boot the dashboard.
 *
 * Falls back gracefully to OSM tiles if no Google Maps key is set.
 * ─────────────────────────────────────────────────────────────────
 */

(async function bootstrap() {
    // ── 1. Fetch keys from the backend ──────────────────────────
    let apiConfig = { googleMapsApiKey: '', openWeatherApiKey: '' };

    try {
        const res = await fetch('http://localhost:5000/api/config');
        if (res.ok) {
            apiConfig = await res.json();
        } else {
            console.warn('[apiLoader] /api/config returned non-OK status:', res.status);
        }
    } catch (e) {
        console.warn('[apiLoader] Could not reach /api/config — using fallback OSM & Open-Meteo.', e.message);
    }

    // Expose globally so app.js, weather.js, etc. can read them
    window.APP_CONFIG = {
        googleMapsApiKey: apiConfig.googleMapsApiKey || '',
        openWeatherApiKey: apiConfig.openWeatherApiKey || ''
    };

    const hasGoogleMaps = window.APP_CONFIG.googleMapsApiKey &&
        window.APP_CONFIG.googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

    const hasOpenWeather = window.APP_CONFIG.openWeatherApiKey &&
        window.APP_CONFIG.openWeatherApiKey !== 'YOUR_OPENWEATHERMAP_API_KEY_HERE';

    console.log(`[apiLoader] Google Maps tiles: ${hasGoogleMaps ? '✅ Key present' : '⚠️ No key — using OSM fallback'}`);
    console.log(`[apiLoader] OpenWeatherMap:    ${hasOpenWeather ? '✅ Key present' : '⚠️ No key — using Open-Meteo fallback'}`);

    // ── 2. Load Google Maps JS API if key is available ──────────
    await new Promise((resolve) => {
        if (!hasGoogleMaps) {
            resolve();
            return;
        }

        // Google Maps must be loaded before Leaflet.GoogleMutant can use it
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${window.APP_CONFIG.googleMapsApiKey}&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('[apiLoader] Google Maps JS API loaded ✅');
            resolve();
        };
        script.onerror = () => {
            console.error('[apiLoader] Google Maps JS API failed to load — falling back to OSM tiles.');
            window.APP_CONFIG.googleMapsApiKey = ''; // disable so app.js uses OSM
            resolve();
        };
        document.head.appendChild(script);
    });

    // ── 3. Dynamically load and execute app.js ───────────────────
    await new Promise((resolve, reject) => {
        const appScript = document.createElement('script');
        appScript.src = 'js/app.js';
        appScript.onload = resolve;
        appScript.onerror = reject;
        document.body.appendChild(appScript);
    });
})();
