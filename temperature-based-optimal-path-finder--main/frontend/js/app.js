let cachedRoutes = [];
let truckMarker = null;
let animationFrameId = null;
let map;
let routeLayerGroup;
let markerLayerGroup;
let customOriginMarker = null;
let isMapPickingMode = false;
let mapPickTarget = null;
let activeSimulationRouteIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log("Thermal Routing Dashboard Initialized");

    // Initialize Voice Navigation Engine
    if (typeof VoiceNav !== 'undefined') {
        VoiceNav.init();
    }

    // Initialize map
    map = L.map('map').setView(CONFIG.MAP.CENTER, CONFIG.MAP.ZOOM);
    routeLayerGroup = L.layerGroup().addTo(map);
    markerLayerGroup = L.layerGroup().addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom marker icons using public Leaflet color markers
    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const blueIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Icon helpers
    const createNumberedIcon = (number, color) => {
        return L.divIcon({
            className: 'custom-numbered-marker',
            html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.45);">${number}</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
    };

    function initBaseMarkers() {
        markerLayerGroup.clearLayers();
        if (customOriginMarker) {
            map.removeLayer(customOriginMarker);
            customOriginMarker = null;
        }
        const hub = CONFIG.LOCATIONS.HUB;
        L.marker([hub.lat, hub.lng], { icon: blueIcon })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>${hub.name}</strong><br>Processing Hub`);

        CONFIG.LOCATIONS.FARMS.forEach((farm, idx) => {
            L.marker([farm.lat, farm.lng], { icon: greenIcon })
                .addTo(markerLayerGroup)
                .bindPopup(`<strong>${farm.name}</strong><br>Farm ${idx + 1}`);
        });
    }

    initBaseMarkers();

    // Data getters
    function getFarm1Data() {
        const name = (document.getElementById('farm1-name')?.value?.trim()) || 'Harihar Farm';
        const lat = parseFloat(document.getElementById('farm1-lat')?.value) || 14.5126;
        const lng = parseFloat(document.getElementById('farm1-lng')?.value) || 75.8055;
        return { id: 'farm_1', name, lat, lng, type: 'farm' };
    }

    function getFarm2Data() {
        const name = (document.getElementById('farm2-name')?.value?.trim()) || 'Honnali Farm';
        const lat = parseFloat(document.getElementById('farm2-lat')?.value) || 14.2407;
        const lng = parseFloat(document.getElementById('farm2-lng')?.value) || 75.6323;
        return { id: 'farm_2', name, lat, lng, type: 'farm' };
    }

    function getCustomOriginData() {
        const name = (document.getElementById('custom-origin-name')?.value?.trim()) || 'Custom Farm Location';
        const lat = parseFloat(document.getElementById('custom-origin-lat')?.value) || 14.6231;
        const lng = parseFloat(document.getElementById('custom-origin-lng')?.value) || 75.6218;
        return { id: 'custom_farm', name, lat, lng, type: 'farm' };
    }

    // Custom Farm Marker helper
    function updateCustomOriginMarker(lat, lng, name) {
        markerLayerGroup.clearLayers();
        if (customOriginMarker) {
            map.removeLayer(customOriginMarker);
            customOriginMarker = null;
        }
        const hub = CONFIG.LOCATIONS.HUB;
        L.marker([hub.lat, hub.lng], { icon: blueIcon })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>${hub.name}</strong><br>Processing Hub`);

        const customPinIcon = L.divIcon({
            className: 'custom-farm-pin',
            html: `<div style="background: #0ea5e9; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">📍</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        customOriginMarker = L.marker([lat, lng], { icon: customPinIcon })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>${name}</strong><br>Custom Farm Origin<br><span style="font-size:11px;color:#94a3b8;">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>`);
        customOriginMarker.openPopup();
        map.panTo([lat, lng]);
    }

    // Multi-Farm Preview Markers helper
    function updateMultiFarmPreviewMarkers() {
        markerLayerGroup.clearLayers();
        if (customOriginMarker) {
            map.removeLayer(customOriginMarker);
            customOriginMarker = null;
        }
        const f1 = getFarm1Data();
        const f2 = getFarm2Data();
        const hubLoc = CONFIG.LOCATIONS.HUB;

        L.marker([f1.lat, f1.lng], { icon: createNumberedIcon('1', '#10b981') })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>① ${f1.name}</strong><br>Waypoint A (Stop 1)<br><span style="font-size:11px;color:#94a3b8;">${f1.lat.toFixed(4)}, ${f1.lng.toFixed(4)}</span>`);

        L.marker([f2.lat, f2.lng], { icon: createNumberedIcon('2', '#38bdf8') })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>② ${f2.name}</strong><br>Waypoint B (Stop 2)<br><span style="font-size:11px;color:#94a3b8;">${f2.lat.toFixed(4)}, ${f2.lng.toFixed(4)}</span>`);

        L.marker([hubLoc.lat, hubLoc.lng], { icon: createNumberedIcon('🏁', '#6366f1') })
            .addTo(markerLayerGroup)
            .bindPopup(`<strong>🏁 GMU Processing Hub</strong><br>Destination: Davanagere<br><span style="font-size:11px;color:#94a3b8;">${hubLoc.lat.toFixed(4)}, ${hubLoc.lng.toFixed(4)}</span>`);

        const bounds = L.latLngBounds([[f1.lat, f1.lng], [f2.lat, f2.lng], [hubLoc.lat, hubLoc.lng]]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }

    function resetMapPickMode() {
        mapPickTarget = null;
        map.getContainer().style.cursor = '';
        const pick1Btn = document.getElementById('pick-farm1-btn');
        if (pick1Btn) {
            pick1Btn.textContent = '🎯 Set Farm 1 on Map';
            pick1Btn.classList.remove('active');
        }
        const pick2Btn = document.getElementById('pick-farm2-btn');
        if (pick2Btn) {
            pick2Btn.textContent = '🎯 Set Farm 2 on Map';
            pick2Btn.classList.remove('active');
        }
        const originPickBtn = document.getElementById('map-pick-mode-btn');
        if (originPickBtn) {
            originPickBtn.textContent = '🎯 Click on Map to Set Farm';
            originPickBtn.classList.remove('active');
        }
    }

    // APMC Mandi Benchmark Rates (Davanagere APMC Market Rates)
    const MANDI_RATES = {
        tomato: 36.50,
        leafy_greens: 42.00,
        mango: 88.00,
        potato_onion: 22.00
    };

    function getCustomCropConfig() {
        const customTray = document.getElementById('custom-crop-tray');
        const produceSelect = document.getElementById('produce-type');
        const isCustomActive = (customTray && customTray.style.display !== 'none') || (produceSelect && produceSelect.value === 'custom');
        if (!isCustomActive) return null;

        const name = (document.getElementById('custom-crop-name')?.value?.trim()) || 'Custom Lab Crop';
        const tRef = parseFloat(document.getElementById('custom-crop-tref')?.value);
        const k = parseFloat(document.getElementById('custom-crop-k')?.value);
        const price = parseFloat(document.getElementById('custom-crop-price')?.value);

        return {
            name,
            tRef: !isNaN(tRef) ? tRef : 10,
            T_ref: !isNaN(tRef) ? tRef : 10,
            k: !isNaN(k) ? k : 0.025,
            pricePerKg: !isNaN(price) ? price : 120,
            rate: !isNaN(price) ? price : 120
        };
    }

    function updateMandiBenchmarkDisplay() {
        const produceSelect = document.getElementById('produce-type');
        const produceKey = produceSelect ? produceSelect.value : 'tomato';
        const customConfig = getCustomCropConfig();
        const weightInput = document.getElementById('cargo-weight');
        const weight = parseFloat(weightInput?.value) || 1000;

        let rate = MANDI_RATES[produceKey] || 36.50;
        let label = 'Tomato Benchmark Rate';

        if (customConfig) {
            rate = customConfig.rate;
            label = `${customConfig.name} Lab Rate`;
        } else if (CONFIG.PRODUCE[produceKey]) {
            rate = MANDI_RATES[produceKey] !== undefined ? MANDI_RATES[produceKey] : CONFIG.PRODUCE[produceKey].rate;
            label = `${CONFIG.PRODUCE[produceKey].name} Benchmark Rate`;
        }

        const rateDisplay = document.getElementById('mandi-rate-display');
        if (rateDisplay) rateDisplay.textContent = `₹${rate.toFixed(2)} / kg`;

        const cropLabel = document.getElementById('mandi-crop-label');
        if (cropLabel) cropLabel.textContent = label;

        const cargoValueDisplay = document.getElementById('mandi-cargo-value');
        if (cargoValueDisplay) {
            const totalValue = Math.round(weight * rate);
            cargoValueDisplay.textContent = `₹${totalValue.toLocaleString('en-IN')}`;
        }

        const timestamp = document.getElementById('mandi-timestamp');
        if (timestamp) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestamp.textContent = `${timeStr} (Live Sync)`;
        }
    }

    // Toggle Custom Crop / Lab Tuner Tray
    const toggleCustomCropBtn = document.getElementById('toggle-custom-crop-btn');
    const customCropTray = document.getElementById('custom-crop-tray');
    const produceSelectElem = document.getElementById('produce-type');
    
    if (toggleCustomCropBtn && customCropTray) {
        toggleCustomCropBtn.addEventListener('click', () => {
            const isOpen = customCropTray.style.display !== 'none';
            if (isOpen) {
                customCropTray.style.display = 'none';
                toggleCustomCropBtn.textContent = '🧪 + Custom Crop / Lab Tuner';
                toggleCustomCropBtn.style.borderColor = '#10b981';
                toggleCustomCropBtn.style.color = '#10b981';
                if (produceSelectElem && produceSelectElem.value === 'custom') {
                    produceSelectElem.value = 'tomato';
                }
            } else {
                customCropTray.style.display = 'block';
                toggleCustomCropBtn.textContent = '✕ Close Lab Tuner';
                toggleCustomCropBtn.style.borderColor = '#38bdf8';
                toggleCustomCropBtn.style.color = '#38bdf8';
                if (produceSelectElem) {
                    produceSelectElem.value = 'custom';
                }
            }
            updateMandiBenchmarkDisplay();
        });
    }

    if (produceSelectElem) {
        produceSelectElem.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                if (customCropTray) customCropTray.style.display = 'block';
                if (toggleCustomCropBtn) {
                    toggleCustomCropBtn.textContent = '✕ Close Lab Tuner';
                    toggleCustomCropBtn.style.borderColor = '#38bdf8';
                    toggleCustomCropBtn.style.color = '#38bdf8';
                }
            }
            updateMandiBenchmarkDisplay();
        });
    }

    // Live update Mandi price when cargo weight or custom crop rates change
    const cargoWeightInput = document.getElementById('cargo-weight');
    if (cargoWeightInput) {
        cargoWeightInput.addEventListener('input', updateMandiBenchmarkDisplay);
    }
    ['custom-crop-name', 'custom-crop-tref', 'custom-crop-k', 'custom-crop-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateMandiBenchmarkDisplay);
    });

    // Initialize Mandi benchmark values
    updateMandiBenchmarkDisplay();

    // Toggle Single Custom Location Tray
    const toggleCustomLocBtn = document.getElementById('toggle-custom-loc-btn');
    const customLocTray = document.getElementById('custom-loc-tray');
    if (toggleCustomLocBtn && customLocTray) {
        toggleCustomLocBtn.addEventListener('click', () => {
            const isOpen = customLocTray.style.display !== 'none';
            if (isOpen) {
                customLocTray.style.display = 'none';
                toggleCustomLocBtn.textContent = '📍 Custom Farm Location';
                toggleCustomLocBtn.style.borderColor = '#10b981';
                toggleCustomLocBtn.style.color = '#10b981';
                resetMapPickMode();
            } else {
                customLocTray.style.display = 'block';
                toggleCustomLocBtn.textContent = '✕ Close Location Picker';
                toggleCustomLocBtn.style.borderColor = '#f59e0b';
                toggleCustomLocBtn.style.color = '#f59e0b';
            }
        });
    }

    // Toggle Multi-Farm Pickup Tray
    const multiFarmCheckbox = document.getElementById('multi-farm-pickup');
    const multiFarmTray = document.getElementById('multi-farm-waypoints-tray');
    if (multiFarmCheckbox) {
        multiFarmCheckbox.addEventListener('change', () => {
            resetMapPickMode();
            if (multiFarmCheckbox.checked) {
                if (multiFarmTray) multiFarmTray.style.display = 'block';
                if (toggleCustomLocBtn) toggleCustomLocBtn.style.display = 'none';
                if (customLocTray) customLocTray.style.display = 'none';
                updateMultiFarmPreviewMarkers();
            } else {
                if (multiFarmTray) multiFarmTray.style.display = 'none';
                if (toggleCustomLocBtn) toggleCustomLocBtn.style.display = 'block';
                const isCustomLocActive = customLocTray && customLocTray.style.display !== 'none';
                if (isCustomLocActive) {
                    const custom = getCustomOriginData();
                    updateCustomOriginMarker(custom.lat, custom.lng, custom.name);
                } else {
                    initBaseMarkers();
                }
            }
        });
    }

    // Map Pick Buttons
    const mapPickBtn = document.getElementById('map-pick-mode-btn');
    if (mapPickBtn) {
        mapPickBtn.addEventListener('click', () => {
            if (mapPickTarget === 'origin') {
                resetMapPickMode();
            } else {
                resetMapPickMode();
                mapPickTarget = 'origin';
                mapPickBtn.textContent = '📍 Click anywhere on the map...';
                mapPickBtn.classList.add('active');
                map.getContainer().style.cursor = 'crosshair';
            }
        });
    }

    const pickFarm1Btn = document.getElementById('pick-farm1-btn');
    if (pickFarm1Btn) {
        pickFarm1Btn.addEventListener('click', () => {
            if (mapPickTarget === 'farm1') {
                resetMapPickMode();
            } else {
                resetMapPickMode();
                mapPickTarget = 'farm1';
                pickFarm1Btn.textContent = '📍 Click map to set Farm 1...';
                pickFarm1Btn.classList.add('active');
                map.getContainer().style.cursor = 'crosshair';
            }
        });
    }

    const pickFarm2Btn = document.getElementById('pick-farm2-btn');
    if (pickFarm2Btn) {
        pickFarm2Btn.addEventListener('click', () => {
            if (mapPickTarget === 'farm2') {
                resetMapPickMode();
            } else {
                resetMapPickMode();
                mapPickTarget = 'farm2';
                pickFarm2Btn.textContent = '📍 Click map to set Farm 2...';
                pickFarm2Btn.classList.add('active');
                map.getContainer().style.cursor = 'crosshair';
            }
        });
    }

    // Map Click Listener
    map.on('click', (e) => {
        if (!mapPickTarget) return;
        const lat = Number(e.latlng.lat.toFixed(4));
        const lng = Number(e.latlng.lng.toFixed(4));

        if (mapPickTarget === 'farm1') {
            const latInput = document.getElementById('farm1-lat');
            const lngInput = document.getElementById('farm1-lng');
            const nameInput = document.getElementById('farm1-name');
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Farm 1';
            updateMultiFarmPreviewMarkers();

            const btn = document.getElementById('pick-farm1-btn');
            if (btn) {
                btn.textContent = '✓ Farm 1 Set!';
                btn.classList.remove('active');
                setTimeout(() => {
                    if (mapPickTarget !== 'farm1' && btn) btn.textContent = '🎯 Set Farm 1 on Map';
                }, 2500);
            }
        } else if (mapPickTarget === 'farm2') {
            const latInput = document.getElementById('farm2-lat');
            const lngInput = document.getElementById('farm2-lng');
            const nameInput = document.getElementById('farm2-name');
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Farm 2';
            updateMultiFarmPreviewMarkers();

            const btn = document.getElementById('pick-farm2-btn');
            if (btn) {
                btn.textContent = '✓ Farm 2 Set!';
                btn.classList.remove('active');
                setTimeout(() => {
                    if (mapPickTarget !== 'farm2' && btn) btn.textContent = '🎯 Set Farm 2 on Map';
                }, 2500);
            }
        } else if (mapPickTarget === 'origin') {
            const latInput = document.getElementById('custom-origin-lat');
            const lngInput = document.getElementById('custom-origin-lng');
            const nameInput = document.getElementById('custom-origin-name');
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Custom Farm Location';
            updateCustomOriginMarker(lat, lng, name);

            const btn = document.getElementById('map-pick-mode-btn');
            if (btn) {
                btn.textContent = '✓ Farm Set from Map!';
                btn.classList.remove('active');
                setTimeout(() => {
                    if (mapPickTarget !== 'origin' && btn) btn.textContent = '🎯 Click on Map to Set Farm';
                }, 2500);
            }
        }

        mapPickTarget = null;
        map.getContainer().style.cursor = '';
    });

    // 1-Click Quick Presets for Single Custom Origin
    document.querySelectorAll('.preset-btn:not(.farm-preset-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name || btn.textContent.trim();
            const lat = parseFloat(btn.dataset.lat);
            const lng = parseFloat(btn.dataset.lng);
            
            const latInput = document.getElementById('custom-origin-lat');
            const lngInput = document.getElementById('custom-origin-lng');
            const nameInput = document.getElementById('custom-origin-name');
            
            if (nameInput) nameInput.value = name;
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            
            updateCustomOriginMarker(lat, lng, name);
        });
    });

    // 1-Click Quick Presets for Multi-Farm Waypoints
    document.querySelectorAll('.farm-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target; // 'farm1' or 'farm2'
            const name = btn.dataset.name || btn.textContent.trim();
            const lat = parseFloat(btn.dataset.lat);
            const lng = parseFloat(btn.dataset.lng);

            if (target === 'farm1') {
                const nameInput = document.getElementById('farm1-name');
                const latInput = document.getElementById('farm1-lat');
                const lngInput = document.getElementById('farm1-lng');
                if (nameInput) nameInput.value = name;
                if (latInput) latInput.value = lat;
                if (lngInput) lngInput.value = lng;
            } else if (target === 'farm2') {
                const nameInput = document.getElementById('farm2-name');
                const latInput = document.getElementById('farm2-lat');
                const lngInput = document.getElementById('farm2-lng');
                if (nameInput) nameInput.value = name;
                if (latInput) latInput.value = lat;
                if (lngInput) lngInput.value = lng;
            }
            updateMultiFarmPreviewMarkers();
        });
    });

    // Manual input typing listeners
    ['farm1-name', 'farm1-lat', 'farm1-lng', 'farm2-name', 'farm2-lat', 'farm2-lng'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const multiFarmCheckbox = document.getElementById('multi-farm-pickup');
                if (multiFarmCheckbox && multiFarmCheckbox.checked) {
                    updateMultiFarmPreviewMarkers();
                }
            });
        }
    });

    // Handle Route Calculation
    const calcBtn = document.getElementById('calculate-route-btn');
    calcBtn.addEventListener('click', async () => {
        const produceSelectElem = document.getElementById('produce-type');
        const produceType = produceSelectElem ? produceSelectElem.value : 'tomato';
        const weight = document.getElementById('cargo-weight').value || '1000';
        
        console.log(`Calculating route for ${weight}kg of ${CONFIG.PRODUCE[produceType] ? CONFIG.PRODUCE[produceType].name : produceType}...`);
        
        // Mock processing update
        const calcBtnText = calcBtn.querySelector('.btn-text');
        calcBtnText.textContent = "Calculating...";
        
        // Reset slider
        const heatwaveSlider = document.getElementById('heatwave-slider');
        if (heatwaveSlider) heatwaveSlider.value = 0;
        const heatwaveLabel = document.getElementById('heatwave-slider-label');
        if (heatwaveLabel) heatwaveLabel.textContent = `Heatwave Stress Test: +0°C`;

        // Clear existing animation
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (truckMarker) map.removeLayer(truckMarker);
        
        // Resolve Origin & Multi-Farm Waypoints
        const multiFarm = document.getElementById('multi-farm-pickup') ? document.getElementById('multi-farm-pickup').checked : false;
        let farm1 = null;
        let farm2 = null;
        let origin = null;

        if (multiFarm) {
            farm1 = getFarm1Data();
            farm2 = getFarm2Data();
            origin = farm1;
        } else {
            const isCustomLocActive = customLocTray && customLocTray.style.display !== 'none';
            if (isCustomLocActive) {
                const customName = document.getElementById('custom-origin-name').value.trim() || 'Custom Farm Location';
                const customLat = parseFloat(document.getElementById('custom-origin-lat').value) || 14.6231;
                const customLng = parseFloat(document.getElementById('custom-origin-lng').value) || 75.6218;
                origin = {
                    id: 'custom_farm',
                    name: customName,
                    lat: customLat,
                    lng: customLng,
                    type: 'farm'
                };
                updateCustomOriginMarker(customLat, customLng, customName);
            } else {
                origin = CONFIG.LOCATIONS.FARMS[0];
            }
        }

        const dest = CONFIG.LOCATIONS.HUB;
        const departureHour = parseInt(document.getElementById('departure-time').value, 10);
        const deadlineHours = parseFloat(document.getElementById('delivery-deadline').value) || 4;

        let routes = null;
        let isBackend = false;
        
        let backendData = null;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 9000);
            
            const produceNameMap = {
                "tomato": "Tomato",
                "leafy_greens": "Leafy Greens",
                "mango": "Mango",
                "potato_onion": "Potato / Onion",
                "custom": "Custom Crop"
            };
            
            const customCrop = getCustomCropConfig();

            const reqBody = {
                produceType: customCrop ? customCrop.name : (produceNameMap[produceType] || produceType),
                departureHour,
                deadlineHours,
                origin,
                destination: dest,
                weight: parseFloat(weight)
            };
            if (customCrop) {
                reqBody.customConfig = customCrop;
            }
            if (multiFarm) {
                reqBody.multiFarm = true;
                reqBody.farm1 = farm1;
                reqBody.farm2 = farm2;
            }

            const response = await fetch("http://localhost:5000/api/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
                signal: controller.signal
            });
            clearTimeout(id);
            
            if (response.ok) {
                backendData = await response.json();
                routes = backendData.rankedRoutes;
                isBackend = true;
            } else {
                throw new Error("Backend non-200 response");
            }
        } catch (error) {
            console.warn(`Backend unreachable, engaging client-side computation engine: ${error.message}`);
        }
        
        const telemetryBadge = document.getElementById('telemetry-status');
        const weatherBadge = document.getElementById('weather-telemetry');
        
        if (isBackend && routes) {
            telemetryBadge.textContent = "Engine: Express Backend (Port 5000)";
            telemetryBadge.className = "telemetry-badge online";
            telemetryBadge.style.color = "#10b981"; // Emerald
            
            if (weatherBadge) {
                weatherBadge.style.display = 'block';
                if (backendData && backendData.isFallback) {
                    weatherBadge.textContent = 'Weather: Offline / Cached Fallback';
                    weatherBadge.className = 'telemetry-badge offline';
                } else {
                    weatherBadge.textContent = 'Weather: Online / Live Open-Meteo';
                    weatherBadge.className = 'telemetry-badge online';
                }
            }
        } else {
            telemetryBadge.textContent = "Engine: Client-Side Fallback";
            telemetryBadge.className = "telemetry-badge offline";
            telemetryBadge.style.color = "#f59e0b"; // Amber
            
            if (multiFarm) {
                routes = await getMultiFarmRoutes(farm1, farm2, dest);
            } else {
                routes = await getRouteAlternatives(origin, dest);
            }
            routes = await attachRouteTemperatures(routes, departureHour);
        }

        // Save baseline temperatures for local slider interactions
        routes.forEach(r => {
            r.baselineSegmentTemps = [...r.segmentTemps];
            r.baselineAvgTemp = r.avgTemp;
        });
        
        cachedRoutes = routes;
        activeSimulationRouteIndex = 0;

        const customCrop = getCustomCropConfig();

        // Render initially
        renderRoutes(cachedRoutes, produceType, deadlineHours, weight, multiFarm, origin, farm1, farm2, customCrop);

        calcBtnText.textContent = "Calculate Optimal Route";
        console.log("Route calculation complete.");
    });

    // Heatwave Slider Logic
    const heatwaveSlider = document.getElementById('heatwave-slider');
    const heatwaveLabel = document.getElementById('heatwave-slider-label');
    heatwaveSlider.addEventListener('input', (e) => {
        const offset = parseInt(e.target.value, 10);
        heatwaveLabel.textContent = `Heatwave Stress Test: +${offset}°C`;
        
        if (!cachedRoutes || cachedRoutes.length === 0) return;
        
        const produceSelectElem = document.getElementById('produce-type');
        const produceType = produceSelectElem ? produceSelectElem.value : 'tomato';
        const deadlineHours = parseFloat(document.getElementById('delivery-deadline').value) || 4;
        const weight = document.getElementById('cargo-weight').value || '1000';
        
        const multiFarm = document.getElementById('multi-farm-pickup') ? document.getElementById('multi-farm-pickup').checked : false;
        let farm1 = null;
        let farm2 = null;
        let origin = null;

        if (multiFarm) {
            farm1 = getFarm1Data();
            farm2 = getFarm2Data();
            origin = farm1;
        } else {
            const isCustomLocActive = customLocTray && customLocTray.style.display !== 'none';
            if (isCustomLocActive) {
                origin = {
                    id: 'custom_farm',
                    name: document.getElementById('custom-origin-name').value.trim() || 'Custom Farm Location',
                    lat: parseFloat(document.getElementById('custom-origin-lat').value) || 14.6231,
                    lng: parseFloat(document.getElementById('custom-origin-lng').value) || 75.6218,
                    type: 'farm'
                };
            } else {
                origin = CONFIG.LOCATIONS.FARMS[0];
            }
        }
        
        // Apply offset to cached routes
        cachedRoutes.forEach(route => {
            route.segmentTemps = route.baselineSegmentTemps.map(temp => temp + offset);
            route.avgTemp = route.baselineAvgTemp + offset;
        });
        
        const customCrop = getCustomCropConfig();
        renderRoutes(cachedRoutes, produceType, deadlineHours, weight, multiFarm, origin, farm1, farm2, customCrop);
    });

    // Dispatch Animation Logic with Selective Route Simulation & Progressive Decay
    const dispatchBtn = document.getElementById('dispatch-btn');
    dispatchBtn.addEventListener('click', () => {
        if (!cachedRoutes || cachedRoutes.length === 0) return;
        
        const simRoute = cachedRoutes[activeSimulationRouteIndex] || cachedRoutes.find(r => r.isRecommended) || cachedRoutes[0];
        if (!simRoute) return;

        const btnText = dispatchBtn.querySelector('.btn-text');

        // Toggle / Cancel if already running
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (typeof VoiceNav !== 'undefined') VoiceNav.cancel();
            if (truckMarker) {
                map.removeLayer(truckMarker);
                truckMarker = null;
            }
            const hud = document.getElementById('dispatch-hud');
            if (hud) hud.style.display = 'none';
            if (btnText) btnText.textContent = `Start Dispatch on ${simRoute.name} ▶`;
            return;
        }

        if (truckMarker) map.removeLayer(truckMarker);

        const routeCoords = simRoute.geometry.coordinates;
        const totalPoints = routeCoords.length;

        // Custom Truck Marker matching route risk
        const truckColor = simRoute.isRecommended ? '#10b981' : '#ef4444';
        const truckIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${truckColor}" width="34" height="34" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;
        const customTruckIcon = L.divIcon({
            html: truckIconSVG,
            className: 'truck-icon',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        truckMarker = L.marker([routeCoords[0][1], routeCoords[0][0]], { icon: customTruckIcon }).addTo(map);

        // Bring active route polyline to front and highlight
        if (simRoute.layer) {
            simRoute.layer.bringToFront();
            simRoute.layer.setStyle({ weight: 6, opacity: 1.0 });
        }

        // Setup Floating HUD
        const hudContainer = document.getElementById('dispatch-hud');
        hudContainer.style.display = 'block';
        document.getElementById('hud-status').style.display = 'none';

        const hudRouteName = document.getElementById('hud-route-name');
        if (hudRouteName) {
            hudRouteName.textContent = `Simulating: ${simRoute.name} ${simRoute.isRecommended ? '(AI RECOMMENDED)' : '(SUBOPTIMAL PATH)'}`;
            hudRouteName.style.color = simRoute.isRecommended ? '#10b981' : '#ef4444';
        }

        if (btnText) btnText.textContent = "Stop Transit Simulation ⏹";

        // Announce start of delivery transit via Voice Navigation
        if (typeof VoiceNav !== 'undefined') {
            VoiceNav.startJourney(simRoute);
        }

        // Biophysical Decay Setup
        const produceSelectElem = document.getElementById('produce-type');
        const produceType = produceSelectElem ? produceSelectElem.value : 'tomato';
        const customCrop = getCustomCropConfig();
        const cropConfig = customCrop || CONFIG.PRODUCE[produceType] || CONFIG.PRODUCE.tomato;
        const T_ref = cropConfig.T_ref !== undefined ? cropConfig.T_ref : (cropConfig.tRef !== undefined ? cropConfig.tRef : 13);
        const k = cropConfig.k !== undefined ? cropConfig.k : 0.030;

        const routeDurationHours = simRoute.duration / 3600;
        const totalDistanceKm = simRoute.distance / 1000;
        const segmentTemps = (simRoute.segmentTemps && simRoute.segmentTemps.length > 0) ? simRoute.segmentTemps : [simRoute.avgTemp || 30];
        const numSegments = segmentTemps.length;
        const hoursPerSegment = routeDurationHours / numSegments;
        
        let startTimestamp = null;
        const animationDuration = 9000; // 9 seconds smooth transit

        function animate(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min(1, (timestamp - startTimestamp) / animationDuration);

            // Interpolate position
            const floatIndex = progress * (totalPoints - 1);
            const index = Math.floor(floatIndex);
            const nextIndex = Math.min(index + 1, totalPoints - 1);
            const weightFrac = floatIndex - index;

            const lat = routeCoords[index][1] * (1 - weightFrac) + routeCoords[nextIndex][1] * weightFrac;
            const lng = routeCoords[index][0] * (1 - weightFrac) + routeCoords[nextIndex][0] * weightFrac;
            truckMarker.setLatLng([lat, lng]);

            // Progress HUD
            const kmTraveled = (progress * totalDistanceKm).toFixed(1);
            const progressPercent = (progress * 100).toFixed(0);
            document.getElementById('hud-progress').textContent = `${progressPercent}% (${kmTraveled} / ${totalDistanceKm.toFixed(1)} km)`;

            // Segment Temperature HUD
            const currentSegmentIdx = Math.min(Math.floor(progress * numSegments), numSegments - 1);
            const currentTemp = segmentTemps[currentSegmentIdx];
            const hudTemp = document.getElementById('hud-temp');
            hudTemp.textContent = `${currentTemp.toFixed(1)}°C`;
            hudTemp.style.color = currentTemp > 34 ? '#ef4444' : (currentTemp > 28 ? '#f59e0b' : '#10b981');

            // Progressive Biophysical Quality Decay: Q(t) = 100 * exp(-k * cumulativeThermalLoad)
            let cumulativeThermalLoadSoFar = 0;
            const elapsedSegmentsFloat = progress * numSegments;
            const fullSegments = Math.floor(elapsedSegmentsFloat);
            for (let s = 0; s < fullSegments && s < numSegments; s++) {
                const hFactor = Math.pow(2, (segmentTemps[s] - T_ref) / 10);
                cumulativeThermalLoadSoFar += hoursPerSegment * hFactor;
            }
            if (fullSegments < numSegments) {
                const partialFraction = elapsedSegmentsFloat - fullSegments;
                const hFactor = Math.pow(2, (segmentTemps[fullSegments] - T_ref) / 10);
                cumulativeThermalLoadSoFar += (partialFraction * hoursPerSegment) * hFactor;
            }

            let liveQuality = 100 * Math.exp(-k * cumulativeThermalLoadSoFar);
            liveQuality = Math.max(0, Math.min(100, liveQuality));

            const hudQuality = document.getElementById('hud-quality');
            hudQuality.textContent = `${liveQuality.toFixed(1)}%`;

            // Color-shift badge in real time as quality degrades
            if (liveQuality >= 80) {
                hudQuality.style.color = '#10b981'; // Green
            } else if (liveQuality >= 65) {
                hudQuality.style.color = '#f59e0b'; // Amber
            } else {
                hudQuality.style.color = '#ef4444'; // Red
            }

            // Update Voice Navigation (turn directions, wrong side, checkpoints)
            if (typeof VoiceNav !== 'undefined') {
                VoiceNav.update(progress, simRoute);
            }

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                truckMarker.setLatLng([routeCoords[totalPoints - 1][1], routeCoords[totalPoints - 1][0]]);
                document.getElementById('hud-progress').textContent = `100% (${totalDistanceKm.toFixed(1)} km)`;
                hudQuality.textContent = `${simRoute.thermal.qualityAtArrival}%`;
                
                const hudStatus = document.getElementById('hud-status');
                hudStatus.style.display = 'block';
                if (simRoute.thermal.qualityAtArrival >= 80) {
                    hudStatus.style.color = '#10b981';
                    hudStatus.textContent = `Produce Delivered at Hub — High Quality Preserved (${simRoute.thermal.qualityAtArrival}%)`;
                } else if (simRoute.thermal.qualityAtArrival >= 65) {
                    hudStatus.style.color = '#f59e0b';
                    hudStatus.textContent = `Produce Delivered at Hub — Moderate Heat Degradation (${simRoute.thermal.qualityAtArrival}%)`;
                } else {
                    hudStatus.style.color = '#ef4444';
                    hudStatus.textContent = `CRITICAL SPOILAGE DETECTED! Severe Thermal Decay (${simRoute.thermal.qualityAtArrival}%) on Hot Road`;
                }

                // Announce destination arrived & start delivery
                if (typeof VoiceNav !== 'undefined') {
                    VoiceNav.arrived(simRoute.thermal ? simRoute.thermal.qualityAtArrival : 85);
                }

                if (btnText) btnText.textContent = `Start Dispatch on ${simRoute.name} ▶`;
                animationFrameId = null;
            }
        }
        animationFrameId = requestAnimationFrame(animate);
    });

    function renderRoutes(routesToRender, produceType, deadlineHours, weight, multiFarm = false, origin = null, farm1 = null, farm2 = null, customConfig = null) {
        // --- Calculate thermal decay for all routes ---
        routesToRender.forEach((route, idx) => {
            if (!route.id) route.id = `route_${idx}`;
            route.thermal = calculateThermalDecay(route, produceType, deadlineHours, customConfig);
        });

        // Sort routes by score ascending (lowest score is best)
        routesToRender.sort((a, b) => a.thermal.score - b.thermal.score);
        
        routesToRender.forEach(r => r.isRecommended = false);
        if (routesToRender.length > 0) {
            routesToRender[0].isRecommended = true;
        }
        
        let fastestRoute = routesToRender[0];
        if (routesToRender.length > 0) {
            for (const route of routesToRender) {
                if (route.duration < fastestRoute.duration) fastestRoute = route;
            }
            
            const actualWeight = parseFloat(weight) || 1000;
            let produceRate = MANDI_RATES[produceType] || 36.50;
            if (customConfig) {
                produceRate = customConfig.rate;
            } else if (CONFIG.PRODUCE[produceType]) {
                produceRate = MANDI_RATES[produceType] !== undefined ? MANDI_RATES[produceType] : CONFIG.PRODUCE[produceType].rate;
            }
            
            let economicSavings = 0;
            if (routesToRender.length > 1) {
                 const worstQuality = Math.min(...routesToRender.map(r => r.thermal.qualityAtArrival));
                 economicSavings = Math.round(actualWeight * produceRate * ((routesToRender[0].thermal.qualityAtArrival - worstQuality) / 100));
            }
            routesToRender[0].economicSavings = Math.max(0, economicSavings);
        }
        
        // Clear existing polylines and dynamic markers
        routeLayerGroup.clearLayers();
        markerLayerGroup.clearLayers();

        if (routesToRender && routesToRender.length > 0) {
            const bounds = L.latLngBounds();
            
            const routeCardsContainer = document.getElementById('route-cards');
            routeCardsContainer.innerHTML = '';
            document.getElementById('route-alternatives-container').style.display = 'block';
            document.getElementById('continuous-monitoring-container').style.display = 'block';

            // Generate AI explanation
            const produceName = customConfig ? customConfig.name : (CONFIG.PRODUCE[produceType] ? CONFIG.PRODUCE[produceType].name : produceType);
            const aiBanner = document.getElementById('ai-decision-banner');
            aiBanner.innerHTML = `<strong>🤖 AI Analysis:</strong> ${generateRecommendationExplanation(routesToRender, produceName)}`;

            // Draw alternative routes first, recommended route last to fix Z-index
            const orderedRoutes = [...routesToRender].sort((a, b) => (a.isRecommended === b.isRecommended ? 0 : a.isRecommended ? 1 : -1));

            // Dynamic Checkpoint Markers
            const hub = CONFIG.LOCATIONS.HUB;
            const currentOrigin = origin || CONFIG.LOCATIONS.FARMS[0];
            const currentFarm1 = farm1 || (multiFarm ? getFarm1Data() : currentOrigin);
            const currentFarm2 = farm2 || (multiFarm ? getFarm2Data() : CONFIG.LOCATIONS.FARMS[1]);

            const primaryRoute = routesToRender[0];
            let markersData = [];
            
            if (multiFarm) {
                // Determine sequence from primary route name
                const sequenceStartsFarm2 = primaryRoute.name && (
                    primaryRoute.name.startsWith(currentFarm2.name) || 
                    primaryRoute.name.includes(`${currentFarm2.name} \u2192`) ||
                    primaryRoute.name.includes(`${currentFarm2.name} →`) ||
                    primaryRoute.name.includes("Farm 2 \u2192 Farm 1")
                );

                if (sequenceStartsFarm2) {
                    markersData.push({ 
                        latlng: [currentFarm2.lat, currentFarm2.lng], 
                        icon: createNumberedIcon('1', '#10b981'), 
                        popup: `<strong>① Stop A:</strong> ${currentFarm2.name}<br>Lat: ${currentFarm2.lat.toFixed(4)}, Lng: ${currentFarm2.lng.toFixed(4)}` 
                    });
                    markersData.push({ 
                        latlng: [currentFarm1.lat, currentFarm1.lng], 
                        icon: createNumberedIcon('2', '#38bdf8'), 
                        popup: `<strong>② Stop B:</strong> ${currentFarm1.name}<br>Lat: ${currentFarm1.lat.toFixed(4)}, Lng: ${currentFarm1.lng.toFixed(4)}` 
                    });
                } else {
                    markersData.push({ 
                        latlng: [currentFarm1.lat, currentFarm1.lng], 
                        icon: createNumberedIcon('1', '#10b981'), 
                        popup: `<strong>① Stop A:</strong> ${currentFarm1.name}<br>Lat: ${currentFarm1.lat.toFixed(4)}, Lng: ${currentFarm1.lng.toFixed(4)}` 
                    });
                    markersData.push({ 
                        latlng: [currentFarm2.lat, currentFarm2.lng], 
                        icon: createNumberedIcon('2', '#38bdf8'), 
                        popup: `<strong>② Stop B:</strong> ${currentFarm2.name}<br>Lat: ${currentFarm2.lat.toFixed(4)}, Lng: ${currentFarm2.lng.toFixed(4)}` 
                    });
                }
                markersData.push({ 
                    latlng: [hub.lat, hub.lng], 
                    icon: createNumberedIcon('🏁', '#6366f1'), 
                    popup: `<strong>🏁 GMU Processing Hub</strong><br>Destination: Davanagere<br>Lat: ${hub.lat.toFixed(4)}, Lng: ${hub.lng.toFixed(4)}` 
                });
                
                // Explanatory badge
                const badgeDiv = document.createElement('div');
                badgeDiv.className = 'multi-farm-badge';
                badgeDiv.innerHTML = `<strong>EVALUATING PICKUP SEQUENCES:</strong> ${currentFarm1.name} & ${currentFarm2.name}`;
                routeCardsContainer.appendChild(badgeDiv);

                bounds.extend([currentFarm1.lat, currentFarm1.lng]);
                bounds.extend([currentFarm2.lat, currentFarm2.lng]);
                bounds.extend([hub.lat, hub.lng]);
            } else {
                const isCustom = origin && origin.id === 'custom_farm';
                const originIcon = isCustom ? L.divIcon({
                    className: 'custom-farm-pin',
                    html: `<div style="background: #0ea5e9; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">📍</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 28]
                }) : createNumberedIcon('1', '#10b981');

                markersData.push({ latlng: [currentOrigin.lat, currentOrigin.lng], icon: originIcon, popup: `📍 Origin: ${currentOrigin.name}` });
                markersData.push({ latlng: [hub.lat, hub.lng], icon: createNumberedIcon('🏁', '#6366f1'), popup: `🏁 GMU Processing Hub (${hub.name}) - Destination` });

                bounds.extend([currentOrigin.lat, currentOrigin.lng]);
                bounds.extend([hub.lat, hub.lng]);
            }

            markersData.forEach(data => {
                L.marker(data.latlng, { icon: data.icon }).addTo(markerLayerGroup).bindPopup(data.popup);
            });

            // Ensure valid active route index
            if (activeSimulationRouteIndex >= routesToRender.length) {
                activeSimulationRouteIndex = 0;
            }

            orderedRoutes.forEach((route, index) => {
                let color;
                let weight;
                let opacity;
                let dashArray;
                let tooltipText;
                
                if (route.isRecommended) {
                    color = "#10b981"; // Emerald
                    weight = 5;
                    opacity = 0.95;
                    dashArray = null;
                    tooltipText = "★ RECOMMENDED: Lowest Thermal Load";
                } else if (route.routeIndex === 0) { // Route 1
                    color = "#ef4444"; // Crimson
                    weight = 3;
                    opacity = 0.45;
                    dashArray = null;
                    tooltipText = "SUBOPTIMAL: High Heat Asphalt Trap";
                } else if (route.routeIndex === 2) { // Route 3
                    color = "#f59e0b"; // Amber
                    weight = 3;
                    opacity = 0.45;
                    dashArray = null;
                    tooltipText = "SUBOPTIMAL: Moderate distance, uneven heat";
                } else { // Route 4
                    color = "#ef4444"; // Crimson
                    weight = 3;
                    opacity = 0.45;
                    dashArray = null;
                    tooltipText = "SUBOPTIMAL: Long detour, severe midday heat";
                }
                
                // Flip GeoJSON coordinates [lon, lat] to Leaflet [lat, lon]
                const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                
                const polyline = L.polyline(latLngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    dashArray: dashArray
                }).addTo(routeLayerGroup);

                polyline.bindTooltip(`<b>${route.name}</b><br>${tooltipText}<br>Quality: ${route.thermal.qualityAtArrival}%`);

                if (route.isRecommended) {
                    polyline.bringToFront();
                    
                    // Intermediate Thermal Checkpoints
                    if (route.segmentTemps && route.segmentTemps.length > 0) {
                        const numCPs = route.segmentTemps.length;
                        const maxCPs = Math.min(3, numCPs);
                        const step = Math.max(1, Math.floor(latLngs.length / maxCPs));
                        for (let i = 0; i < maxCPs; i++) {
                            const idx = Math.min(i * step + Math.floor(step / 2), latLngs.length - 1);
                            const coord = latLngs[idx];
                            const cpIcon = L.divIcon({
                                className: 'thermal-cp-icon',
                                html: `<div style="background: white; border: 2px solid #10b981; color: #10b981; border-radius: 12px; padding: 2px 6px; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">CP ${i+1}: ${route.segmentTemps[i].toFixed(1)}°C</div>`,
                                iconSize: [null, null]
                            });
                            L.marker(coord, { icon: cpIcon }).addTo(markerLayerGroup);
                        }
                    }
                }

                route.layer = polyline;
                bounds.extend(polyline.getBounds());
                
                // Render Route Card
                const card = document.createElement('div');
                const isCardActive = (routesToRender[activeSimulationRouteIndex]?.id === route.id);
                card.className = `route-card ${route.isRecommended ? 'recommended' : 'dimmed'} ${isCardActive ? 'active-route-card' : ''}`;
                card.style.borderLeftColor = color;
                card.id = `card-${route.id}`;
                card.style.cursor = 'pointer';
                card.style.transition = 'all 0.2s ease';
                card.style.opacity = isCardActive ? '1.0' : '0.45';
                
                const riskBadgeClass = `badge-${route.thermal.riskLevel.toLowerCase()}`;
                
                let cardTitle = route.name;
                if (route.isRecommended && multiFarm) {
                    let seq = "Farm 1 → Farm 2 → Hub";
                    if (route.name.includes("Farm 2 → Farm 1") || route.name.includes("Farm 2 \u2192 Farm 1")) {
                        seq = "Farm 2 → Farm 1 → Hub";
                    }
                    const cropName = customConfig ? customConfig.name : (CONFIG.PRODUCE[produceType] ? CONFIG.PRODUCE[produceType].name : 'Crop');
                    cardTitle = `AI RECOMMENDED: ${seq} for ${cropName}`;
                }

                card.innerHTML = `
                    <div class="route-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="color: ${color}; font-size: 0.95rem; margin: 0;">${cardTitle}</h3>
                        ${route.isRecommended 
                            ? '<span class="badge-tag badge-green">★ AI RECOMMENDED</span>' 
                            : '<span class="badge-tag" style="background:#334155;color:#94a3b8;">ALTERNATIVE</span>'}
                    </div>
                    <div class="route-card-stats" style="margin-top:0.75rem;">
                        <div><strong>Distance:</strong> ${route.thermal.distanceKm} km</div>
                        <div><strong>Time:</strong> ${(route.duration / 60).toFixed(0)} mins</div>
                        <div><strong>Avg Temp:</strong> ${route.avgTemp.toFixed(1)}°C</div>
                        <div><strong>Thermal Load:</strong> ${route.thermal.thermalLoad}</div>
                    </div>
                    <div class="status-row">
                        <div>
                            <strong>Quality:</strong> ${route.thermal.qualityAtArrival}%
                            <span class="badge-tag ${riskBadgeClass}">${route.thermal.riskLevel}</span>
                        </div>
                        <div>
                            ${route.thermal.isDeadlineBreached 
                                ? '<span class="badge-tag badge-red">Deadline Exceeded</span>' 
                                : '<span class="badge-tag badge-green">On Schedule</span>'}
                        </div>
                    </div>
                    ${route.isRecommended && route.economicSavings !== undefined ? `<div class="rupee-savings" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; font-weight: 700; padding: 6px 10px; border-radius: 8px; margin-top: 10px; font-size: 13px;">
                        💰 Est. Value Preserved: ₹${Math.max(0, route.economicSavings).toLocaleString('en-IN')} vs Worst Route
                    </div>` : ''}
                    <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted);">
                        Composite Score: <strong>${route.thermal.score}</strong>
                    </div>
                `;
                
                // Selective Route Click: Updates selected simulation path & polyline emphasis
                card.addEventListener('click', () => {
                    const targetIdx = routesToRender.findIndex(r => r.id === route.id);
                    activeSimulationRouteIndex = targetIdx >= 0 ? targetIdx : 0;

                    // Update Card selection outline
                    document.querySelectorAll('.route-card').forEach(c => {
                        c.classList.remove('active-route-card');
                        if (c.id === `card-${route.id}`) {
                            c.classList.add('active-route-card');
                            c.style.opacity = '1.0';
                        } else {
                            c.style.opacity = '0.35';
                        }
                    });

                    // Update Polylines: highlight selected route, dim others
                    routesToRender.forEach(r => {
                        if (r.id === route.id) {
                            r.layer.bringToFront();
                            r.layer.setStyle({ weight: 6, opacity: 1.0 });
                        } else {
                            r.layer.setStyle({ weight: 3, opacity: 0.25 });
                        }
                    });

                    // Update Dispatch Button text
                    const startBtn = document.getElementById('dispatch-btn');
                    if (startBtn) {
                        const btnText = startBtn.querySelector('.btn-text');
                        if (btnText) btnText.textContent = `Start Dispatch on ${route.name} ▶`;
                    }

                    // Reset simulation cleanly if active
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                        if (typeof VoiceNav !== 'undefined') VoiceNav.cancel();
                        if (truckMarker) {
                            map.removeLayer(truckMarker);
                            truckMarker = null;
                        }
                        const hud = document.getElementById('dispatch-hud');
                        if (hud) hud.style.display = 'none';
                    }
                });
                
                routeCardsContainer.appendChild(card);
            });

            // Re-bring selected or recommended route to front
            const activeRoute = routesToRender[activeSimulationRouteIndex] || routesToRender[0];
            if (activeRoute && activeRoute.layer && activeRoute.layer.bringToFront) {
                activeRoute.layer.bringToFront();
                activeRoute.layer.setStyle({ weight: 6, opacity: 1.0 });
            }

            // Update dispatch button text for active route
            const startBtn = document.getElementById('dispatch-btn');
            if (startBtn && activeRoute) {
                const btnText = startBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = `Start Dispatch on ${activeRoute.name} ▶`;
            }

            // Auto-fit to routes
            map.fitBounds(bounds, { padding: [40, 40] });

            // Update telemetry stats from the primary route
            const primary = routesToRender[0];
            document.getElementById('stat-distance').textContent = `${primary.thermal.distanceKm} km`;
            document.getElementById('stat-decay').textContent = `${(100 - primary.thermal.qualityAtArrival).toFixed(1)} %`;
        }
    }
});
