/**
 * voice.js — coolroute Voice Navigation Engine
 * ─────────────────────────────────────────────────────────────────
 * Uses the Web Speech API (SpeechSynthesis) to provide turn-by-turn
 * voice guidance during truck simulation:
 *
 *  • Start of journey announcement
 *  • Thermal checkpoint warnings (CP1, CP2, CP3)
 *  • Turn-by-turn directions (left / right / straight) derived from
 *    coordinate bearing changes along the route polyline
 *  • Off-route (wrong direction) warning
 *  • Arrival + delivery start announcement
 *  • Spoilage alert on high-temperature segments
 *
 * Usage (called from app.js animation loop):
 *   VoiceNav.init()                    — call once on page load
 *   VoiceNav.setEnabled(true/false)    — toggle from UI button
 *   VoiceNav.startJourney(route)       — call when simulation begins
 *   VoiceNav.update(progress, route)   — call every animation frame
 *   VoiceNav.arrived(quality)          — call when simulation ends
 *   VoiceNav.cancel()                  — stop all speech immediately
 * ─────────────────────────────────────────────────────────────────
 */

const VoiceNav = (() => {
    let enabled = true;
    let synth = window.speechSynthesis;
    let lastSpokenProgress = -1;
    let lastSpokenCheckpoint = -1;
    let lastBearingZone = null;
    let toastTimeout = null;
    let voice = null;

    // ── Pick the best English voice available ─────────────────────
    function pickVoice() {
        const voices = synth.getVoices();
        // Prefer Google UK English Female, then US, then any English
        return (
            voices.find(v => v.name.includes('Google UK English Female')) ||
            voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.lang.startsWith('en-') && !v.localService) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0]
        );
    }

    function init() {
        if (!synth) {
            console.warn('[VoiceNav] SpeechSynthesis not supported in this browser.');
            enabled = false;
            return;
        }
        // Voices load asynchronously in Chrome
        synth.onvoiceschanged = () => { voice = pickVoice(); };
        voice = pickVoice();
    }

    // ── Core speak function ───────────────────────────────────────
    function speak(text, priority = false) {
        if (!enabled || !synth) return;
        if (priority) synth.cancel(); // interrupt ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        if (voice) utterance.voice = voice;
        synth.speak(utterance);
        showToast(text);
    }

    // ── Toast overlay on the page ─────────────────────────────────
    function showToast(text) {
        let toast = document.getElementById('voice-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'voice-toast';
            toast.innerHTML = '<span class="toast-icon">🔊</span><span class="toast-text"></span>';
            document.body.appendChild(toast);
        }
        toast.querySelector('.toast-text').textContent = text;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // ── Bearing calculation ───────────────────────────────────────
    function bearingBetween(coord1, coord2) {
        // coord = [lng, lat]
        const lat1 = coord1[1] * Math.PI / 180;
        const lat2 = coord2[1] * Math.PI / 180;
        const dLng = (coord2[0] - coord1[0]) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    function bearingDiff(b1, b2) {
        let d = b2 - b1;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        return d;
    }

    function bearingZone(diff) {
        if (diff > 25 && diff <= 135) return 'right';
        if (diff < -25 && diff >= -135) return 'left';
        if (Math.abs(diff) > 135) return 'uturn';
        return 'straight';
    }

    // ── Turn direction phrases ────────────────────────────────────
    const TURN_PHRASES = {
        right: [
            'Turn right ahead.',
            'Turn right to follow the optimal thermal corridor.',
            'Bear right at the next junction.'
        ],
        left: [
            'Turn left ahead.',
            'Turn left to stay on the cooler road.',
            'Bear left at the next junction.'
        ],
        uturn: [
            'Alert: Vehicle heading wrong side! Please make a U-turn and return to the safe thermal corridor.',
            'Warning: Wrong side detected. Route recalculating. Turn around immediately.',
            'You are going on the wrong side. Please make a U-turn when safe.'
        ],
        straight: [
            'Continue straight ahead.',
            'Stay on the current road.',
            'Keep going straight on this corridor.'
        ]
    };

    function randomPhrase(zone) {
        const arr = TURN_PHRASES[zone] || TURN_PHRASES.straight;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Milestone progress thresholds at which we speak
    const MILESTONES = [0, 25, 50, 75];

    // ── Public API ────────────────────────────────────────────────

    function setEnabled(val) {
        enabled = !!val;
        if (!enabled) synth && synth.cancel();
    }

    function isEnabled() {
        return enabled;
    }

    function wrongSideAlert() {
        if (!enabled) return;
        speak('Alert: Vehicle is going wrong side! Turn around and return to the thermal corridor.', true);
    }

    function startJourney(route) {
        if (!enabled) return;
        lastSpokenProgress = -1;
        lastSpokenCheckpoint = -1;
        lastBearingZone = null;
        const routeName = (route && route.name) || 'the recommended route';
        const quality = (route && route.thermal) ? route.thermal.qualityAtArrival : '';
        const qualityStr = quality ? `. Expected arrival quality: ${quality}%` : '';

        if (route && route.isRecommended === false) {
            speak(
                `Starting delivery transit. Warning: Vehicle is on a suboptimal path with high heat exposure. Voice navigation is active.`,
                true
            );
        } else {
            speak(
                `Starting delivery journey on ${routeName}${qualityStr}. Voice navigation is active.`,
                true
            );
        }
    }

    function update(progress, route) {
        if (!enabled || !route) return;

        const coords = route.geometry && route.geometry.coordinates;
        const progressPercent = Math.floor(progress * 100);

        // ── 1. Milestone announcements (0%, 25%, 50%, 75%) ────────
        const reachedMilestone = MILESTONES.find(m => progressPercent >= m && lastSpokenProgress < m);
        if (reachedMilestone !== undefined) {
            lastSpokenProgress = reachedMilestone;
            if (reachedMilestone === 0) {
                // Already announced at startJourney
            } else if (reachedMilestone === 25) {
                speak('Quarter of the journey complete. Thermal conditions nominal.');
            } else if (reachedMilestone === 50) {
                speak('Halfway there. Monitoring temperature along the corridor.');
            } else if (reachedMilestone === 75) {
                speak('Three-quarters complete. Approaching the APMC Mandi hub.');
            }
        }

        // ── 2. Turn-by-turn based on coordinate bearing change ─────
        if (coords && coords.length > 3) {
            const totalPoints = coords.length;
            const floatIdx = progress * (totalPoints - 1);
            const idx = Math.floor(floatIdx);

            // Look 5% of the route ahead to give early turn warnings
            const lookAheadIdx = Math.min(
                totalPoints - 1,
                idx + Math.max(3, Math.floor(totalPoints * 0.05))
            );

            if (idx >= 1 && lookAheadIdx < totalPoints) {
                const prev = coords[Math.max(0, idx - 1)];
                const curr = coords[idx];
                const next = coords[lookAheadIdx];

                const bearingIn = bearingBetween(prev, curr);
                const bearingOut = bearingBetween(curr, next);
                const diff = bearingDiff(bearingIn, bearingOut);
                const zone = bearingZone(diff);

                // Only speak turn if zone changed AND it's not 'straight'
                // Rate-limit: only once per 10% of route
                const progressBucket = Math.floor(progress * 10);
                const zoneKey = `${zone}_${progressBucket}`;

                if (zone !== 'straight' && zoneKey !== lastBearingZone) {
                    lastBearingZone = zoneKey;
                    speak(randomPhrase(zone));
                }
            }
        }

        // ── 3. Thermal checkpoint warnings ─────────────────────────
        if (route.segmentTemps && route.segmentTemps.length > 0) {
            const numSegs = route.segmentTemps.length;
            const segIdx = Math.min(Math.floor(progress * numSegs), numSegs - 1);
            const temp = route.segmentTemps[segIdx];

            if (segIdx !== lastSpokenCheckpoint) {
                lastSpokenCheckpoint = segIdx;
                if (temp > 36) {
                    speak(`Warning! High heat zone detected: ${temp.toFixed(0)} degrees Celsius. Quality degradation accelerating.`);
                } else if (temp > 32 && segIdx > 0) {
                    speak(`Elevated temperature: ${temp.toFixed(0)} degrees. Monitoring produce quality.`);
                }
            }
        }
    }

    function arrived(quality) {
        if (!enabled) return;
        let msg;
        if (quality >= 80) {
            msg = `Goal reached! Vehicle arrived at APMC Mandi destination. Starting delivery now. Produce quality is preserved at ${quality}%.`;
        } else if (quality >= 65) {
            msg = `Goal reached! Vehicle arrived at destination. Starting delivery immediately. Produce quality is ${quality}%.`;
        } else {
            msg = `Goal reached! Destination arrived. Critical warning: Produce quality degraded to ${quality}%. Starting emergency delivery inspection.`;
        }
        speak(msg, true);
    }

    function cancel() {
        synth && synth.cancel();
    }

    return { init, setEnabled, isEnabled, startJourney, update, arrived, cancel, wrongSideAlert, speak };
})();
